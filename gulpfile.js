const gulp = require("gulp");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const log = require("fancy-log");
const archiver = require("archiver");
const stringify = require("json-stringify-pretty-compact");
const typescript = require("typescript");
const babelify = require("babelify");
//const glslify = require("glslify");
const tsify = require("tsify");
const { glob, globSync } = require("glob");
const rename = require("gulp-rename");

const sourcemaps = require("gulp-sourcemaps");

const uglify = require("gulp-uglify");
//import * as ts from "gulp-typescript";
const ts = require("gulp-typescript");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const less = require("gulp-less");
const sass = require("gulp-sass")(require("sass"));
const git = require("gulp-git");
const browserify = require("browserify");

const argv = require("yargs").argv;

sass.compiler = require("sass");

function getConfig() {
  const configPath = path.resolve(process.cwd(), "foundryconfig.json");
  console.log(chalk.blue(`Foundry config path is ${configPath}`));
  let config;

  if (fs.existsSync(configPath)) {
    config = fs.readJSONSync(configPath);
    return config;
  } else {
    return;
  }
}

function getManifest() {
  const json = {};

  if (fs.existsSync("src")) {
    json.root = "src";
  } else {
    json.root = "dist";
  }

  const modulePath = path.join(json.root, "module.json");
  const systemPath = path.join(json.root, "system.json");

  if (fs.existsSync(modulePath)) {
    json.file = fs.readJSONSync(modulePath);
    json.name = "module.json";
  } else if (fs.existsSync(systemPath)) {
    json.file = fs.readJSONSync(systemPath);
    json.name = "system.json";
  } else {
    return;
  }

  return json;
}

/**
 * TypeScript transformers
 * @returns {typescript.TransformerFactory<typescript.SourceFile>}
 */
function createTransformer() {
  /**
   * @param {typescript.Node} node
   */
  function shouldMutateModuleSpecifier(node) {
    if (
      !typescript.isImportDeclaration(node) &&
      !typescript.isExportDeclaration(node)
    )
      return false;
    if (node.moduleSpecifier === undefined) return false;
    if (!typescript.isStringLiteral(node.moduleSpecifier)) return false;
    if (
      !node.moduleSpecifier.text.startsWith("./") &&
      !node.moduleSpecifier.text.startsWith("../")
    )
      return false;
    if (path.extname(node.moduleSpecifier.text) !== "") return false;
    return true;
  }

  /**
   * Transforms import/export declarations to append `.js` extension
   * @param {typescript.TransformationContext} context
   */
  function importTransformer(context) {
    return (node) => {
      /**
       * @param {typescript.Node} node
       */
      function visitor(node) {
        if (shouldMutateModuleSpecifier(node)) {
          if (typescript.isImportDeclaration(node)) {
            const newModuleSpecifier = typescript.createLiteral(
              `${node.moduleSpecifier.text}.js`
            );
            return typescript.updateImportDeclaration(
              node,
              node.decorators,
              node.modifiers,
              node.importClause,
              newModuleSpecifier
            );
          } else if (typescript.isExportDeclaration(node)) {
            const newModuleSpecifier = typescript.createLiteral(
              `${node.moduleSpecifier.text}.js`
            );
            return typescript.updateExportDeclaration(
              node,
              node.decorators,
              node.modifiers,
              node.exportClause,
              newModuleSpecifier
            );
          }
        }
        return typescript.visitEachChild(node, visitor, context);
      }

      return typescript.visitNode(node, visitor);
    };
  }

  return importTransformer;
}

let tsProject = ts.createProject("tsconfig.json");

/********************/
/*		BUILD		*/
/********************/

function buildJS() {
  return gulp
    .src(["src/**/*.js", "!src/lib/*"])
    .pipe(uglify())
    .pipe(gulp.dest("dist"));
}

//Babel COmpiler Options
//BE CAREFUL: Adding an 'extensions:' preset broke class compilation for .ts
let babelconfig = {
  presets: ["@babel/preset-env", "@babel/preset-typescript"],
};

//Personal Config for easy path changing
var config = {
  dev: {
    sass: "./src/sass/**/*.scss",
    ts: "./src/ts/**/*.ts",
    entries: "./src/bd-card-tools.ts", //main entry points
  },
  prod: {
    css: "./dist/css/",
    html: "./",
    js: "./dist/",
  },
};

var uglfiyConfig = {
  mangle: false,
};

function buildTSC() {
  console.log(config.dev.entries);
  return gulp
    .src("src/**/*.ts")
    .pipe(tsProject())
    .js.pipe(gulp.dest(config.prod.js));
}

function buildTS(done) {
  var entries = glob.sync(config.dev.entries);
  entries.forEach((entry) => {
    log(entry);
    log(chalk.blue("started building " + entry));
    browserify({ entries: [entry] })
      .external("pixi.js")
      .plugin(tsify) //, tsconfig)
      .transform(babelify, babelconfig)
      //.plugin("browserify-derequire")
      .on("error", (err) => {
        log("babel error: " + err);
      })
      //.transform(glslify) //convert all glsl code to strings
      .bundle()
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify(uglfiyConfig))
      .pipe(
        rename(function (opt) {
          opt.basename = opt.basename.replace("-main", "");
          opt.dirname = opt.dirname.replace("src", "");
          opt.extname = ".js";
        })
      )
      .pipe(sourcemaps.write("./"))
      .pipe(gulp.dest(config.prod.js))
      .on("end", () => {
        log("finished building " + entry);
      });
  });

  //livereload();
  done();
}

// function buildTS() {
//   const debug = process.env.npm_lifecycle_event !== "package";
//   let res = tsConfig.src().pipe(sourcemaps.init()).pipe(tsConfig());

//   return res.js
//     .pipe(
//       sourcemaps.write("", {
//         debug: debug,
//         includeContent: true,
//         sourceRoot: "./src",
//       })
//     )
//     .pipe(gulp.dest("dist"));
// }

// const bundleModule = () => {
//   const debug = argv.dbg || argv.debug;
//   const bsfy = browserify(path.join(__dirname, "src/foundry-map-gen.ts"), {
//     debug: debug,
//   });
//   return bsfy
//     .on("error", Logger.Err)
//     .plugin(tsify)
//     .bundle()
//     .pipe(source(path.join("dist", "bundle.js")))
//     .pipe(buffer())
//     .pipe(sourcemaps.init({ loadMaps: true }))
//     .pipe(uglify())
//     .pipe(sourcemaps.write("./"))
//     .pipe(gulp.dest("./"));
// };

/**
 * Build TypeScript
 */
// function buildTS() {
//   return gulp
//     .src("src/foundry-map-gen.ts")
//     .pipe(tsConfig())
//     .pipe(gulp.dest("dist"));
// }
// function buildTS() {
//   return (
//     browserify({
//       basedir: ".",
//       debug: true,
//       entries: ["src/foundry-map-gen.ts"],
//     })
//       .plugin(tsify, { noImplicitAny: false })
//       .transform(glslify)
//       .transform(babelify, { presets: ["@babel/preset-env"] })
//       .bundle()
//       .pipe(source("map-generator.js"))
//       .pipe(buffer())
//       //.pipe(sourcemaps.init({ loadMaps: true }))
//       //.pipe(uglify())
//       .pipe(sourcemaps.write("./"))
//       .pipe(gulp.dest("./dist"))
//   );
// }

/**
 * Build Less
 */
function buildLess() {
  return gulp.src("src/*.less").pipe(less()).pipe(gulp.dest("dist"));
}

/**
 * Build SASS
 */
function buildSASS() {
  return gulp
    .src("src/templates/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("dist/templates"));
}

/**
 * Copy static files
 */
async function copyFiles() {
  const name = path.basename(path.resolve("."));
  const statics = [
    "languages",
    "fonts",
    "assets",
    "templates",
    "module.json",
    "system.json",
    "template.json",
    "styles",
    //`${name}.css`,
  ];
  try {
    for (const file of statics) {
      if (fs.existsSync(path.join("src", file))) {
        await fs.copy(path.join("src", file), path.join("dist", file));
      }
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

/**
 * Watch for changes for each build step
 */
function buildWatch() {
  gulp.watch("src/**/*.js", { ignoreInitial: false }, buildJS);
  gulp.watch("src/**/*.ts", { ignoreInitial: false }, buildTS);
  gulp.watch("src/**/*.less", { ignoreInitial: false }, buildLess);
  gulp.watch("src/**/*.scss", { ignoreInitial: false }, buildSASS);
  gulp.watch(
    ["src/fonts", "src/lang", "src/templates", "src/*.json"],
    { ignoreInitial: false },
    copyFiles
  );
}

/********************/
/*		CLEAN		*/
/********************/

/**
 * Remove built files from `dist` folder
 * while ignoring source files
 */
async function clean() {
  const name = path.basename(path.resolve(".")); //get the name of our root directory, which should also be the name of our entry point
  console.log(chalk.cyan(`Path is ${name}`));
  const files = [];

  // If the project uses TypeScript
  if (fs.existsSync(path.join("src", `${name}.ts`))) {
    files.push(
      "languages",
      "templates",
      "assets",
      "module",
      "styles", //`${name}.css`,
      `${name}.js`,
      `${name}.js.map`,
      "module.json",
      "system.json",
      "template.json"
    );
  }

  // If the project uses Less or SASS
  if (
    fs.existsSync(path.join("src", `${name}.less`)) ||
    fs.existsSync(path.join("src", `${name}.scss`))
  ) {
    files.push("fonts", `${name}.css`);
  }

  console.log(" ", chalk.yellow("Files to clean:"));
  console.log("   ", chalk.blueBright(files.join("\n    ")));

  // Attempt to remove the files
  try {
    for (const filePath of files) {
      await fs.remove(path.join("dist", filePath));
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

/********************/
/*		LINK		*/
/********************/

/**
 * Link build to User Data folder
 */
async function linkUserData() {
  const name = path.basename(path.resolve("."));
  const config = fs.readJSONSync("foundryconfig.json");

  console.log(chalk.blue(`config is ${config}`));
  let destDir;
  try {
    if (
      fs.existsSync(path.resolve(".", "dist", "module.json")) ||
      fs.existsSync(path.resolve(".", "src", "module.json"))
    ) {
      destDir = "modules";
    } else if (
      fs.existsSync(path.resolve(".", "dist", "system.json")) ||
      fs.existsSync(path.resolve(".", "src", "system.json"))
    ) {
      destDir = "systems";
    } else {
      throw Error(
        `Could not find ${chalk.blueBright(
          "module.json"
        )} or ${chalk.blueBright("system.json")}`
      );
    }

    let linkDir;
    if (config.dataPath) {
      if (!fs.existsSync(path.join(config.dataPath, "Data")))
        throw Error("User Data path invalid, no Data directory found");

      linkDir = path.join(config.dataPath, "Data", destDir, name);
      console.log(chalk.yellow(`creating link dir is ${linkDir}`));
    } else {
      throw Error("No User Data path defined in foundryconfig.json");
    }

    //pass arg --clean or -c to remove the old files from the dest
    if (argv.clean || argv.c) {
      console.log(
        chalk.yellow(`Removing build in ${chalk.blueBright(linkDir)}`)
      );

      await fs.remove(linkDir);
    } else if (!fs.existsSync(linkDir)) {
      console.log(chalk.green(`Copying build to ${chalk.blueBright(linkDir)}`));
      await fs.symlink(path.resolve("./dist"), linkDir, (type = "dir"));
    }
    return Promise.resolve();
  } catch (err) {
    Promise.reject(err);
  }
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Package build
 */
async function packageBuild() {
  const manifest = getManifest();

  return new Promise((resolve, reject) => {
    try {
      // Remove the package dir without doing anything else
      if (argv.clean || argv.c) {
        console.log(chalk.yellow("Removing all packaged files"));
        fs.removeSync("package");
        return;
      }

      // Ensure there is a directory to hold all the packaged versions
      fs.ensureDirSync("package");

      // Initialize the zip file
      const zipName = `${manifest.file.name}-v${manifest.file.version}.zip`;
      const zipFile = fs.createWriteStream(path.join("package", zipName));
      const zip = archiver("zip", { zlib: { level: 9 } });

      zipFile.on("close", () => {
        console.log(chalk.green(zip.pointer() + " total bytes"));
        console.log(chalk.green(`Zip file ${zipName} has been written`));
        return resolve();
      });

      zip.on("error", (err) => {
        throw err;
      });

      zip.pipe(zipFile);

      // Add the directory with the final code
      zip.directory("dist/", manifest.file.name);

      zip.finalize();
    } catch (err) {
      return reject(err);
    }
  });
}

/*********************/
/*		PACKAGE		 */
/*********************/

/**
 * Update version and URLs in the manifest JSON
 */
function updateManifest(cb) {
  const packageJson = fs.readJSONSync("package.json");
  const config = getConfig(),
    manifest = getManifest(),
    rawURL = config.rawURL,
    repoURL = config.repository,
    manifestRoot = manifest.root;

  if (!config) cb(Error(chalk.red("foundryconfig.json not found")));
  if (!manifest) cb(Error(chalk.red("Manifest JSON not found")));
  if (!rawURL || !repoURL)
    cb(
      Error(chalk.red("Repository URLs not configured in foundryconfig.json"))
    );

  try {
    const version = argv.update || argv.u;

    /* Update version */

    const versionMatch = /^(\d{1,}).(\d{1,}).(\d{1,})$/;
    const currentVersion = manifest.file.version;
    let targetVersion = "";

    console.log(argv.u);

    if (!version) {
      cb(Error("Missing version number"));
    }

    if (versionMatch.test(version)) {
      targetVersion = version;
    } else {
      targetVersion = currentVersion.replace(
        versionMatch,
        (substring, major, minor, patch) => {
          console.log(
            substring,
            Number(major) + 1,
            Number(minor) + 1,
            Number(patch) + 1
          );
          if (version === "major") {
            return `${Number(major) + 1}.0.0`;
          } else if (version === "minor") {
            return `${major}.${Number(minor) + 1}.0`;
          } else if (version === "patch") {
            return `${major}.${minor}.${Number(patch) + 1}`;
          } else {
            return "";
          }
        }
      );
    }

    if (targetVersion === "") {
      return cb(Error(chalk.red("Error: Incorrect version arguments.")));
    }

    if (targetVersion === currentVersion) {
      return cb(
        Error(
          chalk.red("Error: Target version is identical to current version.")
        )
      );
    }
    console.log(`Updating version number to '${targetVersion}'`);

    packageJson.version = targetVersion;
    manifest.file.version = targetVersion;

    /* Update URLs */

    const result = `${rawURL}/v${manifest.file.version}/package/${manifest.file.name}-v${manifest.file.version}.zip`;

    manifest.file.url = repoURL;
    manifest.file.manifest = `${rawURL}/master/${manifestRoot}/${manifest.name}`;
    manifest.file.download = result;

    console.log(manifest.file.manifest);

    const prettyProjectJson = stringify(manifest.file, {
      maxLength: 35,
      indent: "\t",
    });

    fs.writeJSONSync("package.json", packageJson, { spaces: "\t" });
    fs.writeFileSync(
      path.join(manifest.root, manifest.name),
      prettyProjectJson,
      "utf8"
    );

    return cb();
  } catch (err) {
    cb(err);
  }
}

function gitAdd() {
  return gulp.src("package").pipe(git.add({ args: "--no-all" }));
}

function gitCommit() {
  return gulp.src("./*").pipe(
    git.commit(`v${getManifest().file.version}`, {
      args: "-a",
      disableAppendPaths: true,
    })
  );
}

function gitTag() {
  const manifest = getManifest();
  return git.tag(
    `v${manifest.file.version}`,
    `Updated to ${manifest.file.version}`,
    (err) => {
      if (err) throw err;
    }
  );
}

const execGit = gulp.series(gitAdd, gitCommit, gitTag);

const execBuild = gulp.parallel(
  buildJS,
  buildTS,
  buildLess,
  buildSASS,
  copyFiles
);

const execBuildNoTS = gulp.parallel(buildJS, buildLess, buildSASS, copyFiles);

exports.build = gulp.series(clean, execBuild);
exports.buildNoTS = gulp.series(clean, execBuildNoTS);
exports.buildTS = buildTS;
exports.buildTSC = buildTSC;
exports.buildJS = buildJS;
exports.watch = buildWatch;
exports.clean = clean;
exports.link = linkUserData;
exports.package = packageBuild;
exports.update = updateManifest;
exports.publish = gulp.series(
  clean,
  updateManifest,
  execBuild,
  packageBuild,
  execGit
);
