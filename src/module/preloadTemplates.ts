export const preloadTemplates = async function () {
  const templatePaths: string[] = [
    // Add paths to "modules/foundry-map-gen/templates"
  ];

  return loadTemplates(templatePaths);
};
