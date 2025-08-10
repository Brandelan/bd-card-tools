const gulp = require("gulp");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const archiver = require("archiver");
const ts = require("gulp-typescript");
const sass = require("gulp-sass")(require("sass"));
const less = require("gulp-less");
const sourcemaps = require("gulp-sourcemaps");
const rename = require("gulp-rename");
const browserify = require("browserify");
const tsify = require("tsify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const uglify = require("gulp-uglify");
const git = require("gulp-git");
const conventionalGithubReleaser = require("conventional-github-releaser");
const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");
// load environment variables
const result = dotenv.config();

if (result.error) {
  throw result.error;
}

const argv = require("yargs").argv;

const foundryConfig = fs.readJSONSync("foundryconfig.json");
const projectName = path.basename(path.resolve("."));
const manifestPath = fs.existsSync("src/module.json")
  ? "src/module.json"
  : "src/system.json";
const manifest = fs.readJSONSync(manifestPath);
const tsProject = ts.createProject("tsconfig.json");

// File paths
const paths = {
  tsEntry: "./src/bd-card-tools.ts",
  tsFiles: "src/**/*.ts",
  sass: "src/**/*.scss",
  less: "src/**/*.less",
  static: ["languages", "assets", "templates", "styles", "fonts"],
  dist: "dist",
};

// Clean dist folder
async function clean() {
  await fs.remove(paths.dist);
  console.log(chalk.yellow("Cleaned dist folder."));
}

// Compile TypeScript
function buildTS() {
  return browserify({ entries: [paths.tsEntry], debug: true })
    .plugin(tsify)
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest(paths.dist));
}

// Compile SASS
function buildSASS() {
  return gulp
    .src(paths.sass)
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest(`${paths.dist}/css`));
}

// Compile LESS
function buildLESS() {
  return gulp
    .src(paths.less)
    .pipe(less())
    .pipe(gulp.dest(`${paths.dist}/css`));
}

// Copy static assets
async function copyStatic() {
  for (const dir of paths.static) {
    const srcPath = `src/${dir}`;
    if (fs.existsSync(srcPath)) {
      await fs.copy(srcPath, `${paths.dist}/${dir}`);
    }
  }

  // Copy manifest
  await fs.copy(manifestPath, `${paths.dist}/${path.basename(manifestPath)}`);
}

// Create symlink to Foundry user data
async function linkToFoundry() {
  const targetDir = fs.existsSync(`${paths.dist}/module.json`)
    ? "modules"
    : "systems";
  const dest = path.join(
    foundryConfig.dataPath,
    "Data",
    targetDir,
    projectName
  );
  if (fs.existsSync(dest)) {
    await fs.remove(dest);
  }
  await fs.symlink(path.resolve(paths.dist), dest, "dir");
  console.log(chalk.green(`Linked to Foundry at ${dest}`));
}

// Package module/system
async function packageZip() {
  const zipName = `${manifest.name}-v${manifest.version}.zip`;
  const output = fs.createWriteStream(`./package/${zipName}`);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(paths.dist, manifest.name);
  await archive.finalize();

  console.log(chalk.green(`Packaged ${zipName}`));
}

// Update manifest URLs
function updateManifest(cb) {
  const version = argv.update || manifest.version;
  const base = `${foundryConfig.rawURL}/v${version}`;
  manifest.version = version;
  manifest.manifest = `${foundryConfig.rawURL}/latest/download/module.json`;
  manifest.download = `${foundryConfig.rawURL}/download/v${version}/${manifest.name}-v${manifest.version}.zip`;
  manifest.url = foundryConfig.repository;

  fs.writeJSONSync(manifestPath, manifest, { spaces: 2 });
  fs.writeJSONSync(
    "package.json",
    { ...require("./package.json"), version },
    { spaces: 2 }
  );

  console.log(chalk.cyan(`Updated manifest to version ${version}`));
  cb();
}

// Watch source files
function watchFiles() {
  gulp.watch(paths.tsFiles, buildTS);
  gulp.watch(paths.sass, buildSASS);
  gulp.watch(paths.less, buildLESS);
}

/* -------------------------------
   Git tasks based on manifest
--------------------------------*/
function gitAdd() {
  return gulp.src("package").pipe(git.add({ args: "--no-all" }));
}

function gitCommitFromManifest() {
  const msg = `Release v${manifest.version}`;
  console.log(chalk.blue(`Committing: ${msg}`));
  return gulp.src("./*").pipe(git.commit(msg));
}

function gitTagFromManifest(cb) {
  const tagName = `v${manifest.version}`;
  const tagMsg = `${manifest.name} ${manifest.version}`;
  console.log(chalk.blue(`Tagging: ${tagName} - ${tagMsg}`));
  git.tag(tagName, tagMsg, (err) => {
    if (err) return cb(err);
    cb();
  });
}

function gitPush(cb) {
  git.push("origin", "master", { args: "--tags" }, (err) => {
    if (err) return cb(err);
    cb();
  });
}

/* -------------------------------
Release tasks
--------------------------------*/
function githubRelease(done) {
  console.log(`Owner is ${manifest.author}, and repo name is ${manifest.id}`);
  // You must have GITHUB_TOKEN env variable set with a GitHub token
  conventionalGithubReleaser(
    { type: "oauth", token: process.env.GH_TOKEN },
    {
      // optional config: you can specify preset etc.
      preset: "angular", // or your preferred conventional commit preset
    },
    done
  );
}

// Upload release assets after creating the release with conventional-github-releaser
async function uploadReleaseAssets() {
  const octokit = new Octokit({
    auth: process.env.GH_TOKEN,
  });

  const owner = `${manifest.author}`; // Replace with your GitHub username or organization
  const repo = `${manifest.id}`; //"your-repo-name";
  const tag = `v${manifest.version}`;

  // 1. Get the release by tag
  const releases = await octokit.repos.listReleases({ owner, repo });
  const release = releases.data.find((r) => r.tag_name === tag);
  if (!release) {
    throw new Error(`Release with tag ${tag} not found.`);
  }
  // List of files to upload as assets
  const filesToUpload = [
    path.resolve("./package", `${manifest.name}-v${manifest.version}.zip`),
    path.resolve("src/module.json"),
  ];

  for (const filePath of filesToUpload) {
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filePath} does not exist, skipping upload.`);
      continue;
    }

    const assetName = path.basename(filePath);
    const contentType = assetName.endsWith(".zip")
      ? "application/zip"
      : "application/json";

    const assetData = fs.readFileSync(filePath);

    console.log(`Uploading ${assetName}...`);

    await octokit.repos.uploadReleaseAsset({
      url: release.upload_url,
      headers: {
        "content-type": contentType,
        "content-length": assetData.length,
      },
      name: assetName,
      data: assetData,
    });

    console.log(`Uploaded ${assetName}`);
  }
}

/* -------------------------------
   Publish task
--------------------------------*/
const publish = gulp.series(
  updateManifest,
  gulp.series(
    clean,
    gulp.parallel(buildTS, buildSASS, buildLESS, copyStatic),
    packageZip
  ),
  gitAdd,
  gitCommitFromManifest,
  gitTagFromManifest,
  gitPush
  // githubRelease,
  // uploadReleaseAssets
);

// Exports
exports.clean = clean;
exports.build = gulp.series(
  clean,
  gulp.parallel(buildTS, buildSASS, buildLESS, copyStatic)
);
exports.watch = gulp.series(exports.build, watchFiles);
exports.link = gulp.series(exports.build, linkToFoundry);
exports.package = gulp.series(exports.build, packageZip);
exports.publish = publish;
exports.update = updateManifest;
