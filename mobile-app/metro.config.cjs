const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Monorepo support: watch the workspace root so edits inside
// packages/shared trigger a Metro refresh (mobile-app is a real
// directory in the root repo now, not a separate git checkout), and
// let Metro resolve dependencies npm workspaces hoisted to the root
// node_modules instead of only looking in mobile-app's own.
config.watchFolders = [monorepoRoot];

// IMPORTANT: nu suprascrie tot transformer-ul, păstrează restul setărilor
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
  nodeModulesPaths: [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(monorepoRoot, "node_modules"),
  ],
};

module.exports = withNativeWind(config, { input: "./global.css" });
