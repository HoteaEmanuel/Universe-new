const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
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
  // packages/shared's internal imports use TypeScript's ESM convention —
  // e.g. `from "./admin.js"` pointing at admin.ts — which tsc (moduleResolution:
  // "bundler") and Vite (frontend) resolve natively, but Metro doesn't by
  // default: it treats an explicit ".js" specifier as literal and won't try
  // ".ts"/".tsx" for it. Strip the extension and let Metro's normal
  // sourceExts probing (which does include ts/tsx) find the real file,
  // falling back to the literal specifier for genuine .js/.jsx files.
  resolveRequest: (context, moduleName, platform) => {
    if (/^\.{1,2}\//.test(moduleName) && /\.jsx?$/.test(moduleName)) {
      try {
        return context.resolveRequest(context, moduleName.replace(/\.jsx?$/, ""), platform);
      } catch {
        // Fall through: a real .js/.jsx file, or genuinely missing.
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

// withUniwindConfig must be the outermost wrapper.
// polyfills.rem is the pixel value of 1rem at build time. global.css declares
// the spacing, type and radius scales in px, so this only reaches the handful
// of Tailwind defaults we don't override (max-w-*, breakpoints). 16 makes
// those match the web build instead of NativeWind's old 14px native base.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  polyfills: { rem: 16 },
});
