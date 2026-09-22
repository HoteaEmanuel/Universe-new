// https://docs.expo.dev/guides/using-eslint/
//
// Not using eslint-config-expo/flat directly: its typescript.js and the
// eslint-plugin-import resolver both eagerly touch @typescript-eslint /
// eslint-import-resolver-typescript, which crash on load against this
// repo's TypeScript 7 (same reason frontend/eslint.config.js also skips
// @typescript-eslint and eslint-plugin-import). Type correctness is
// `tsc --noEmit` (the `typecheck` script), not lint, same as the rest of
// the repo.
const js = require("@eslint/js");
const globals = require("globals");
const pluginReact = require("eslint-plugin-react");
const pluginReactHooks = require("eslint-plugin-react-hooks");
const expo = require("eslint-plugin-expo");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  {
    ignores: ["dist/*", "android/*", "ios/*"],
  },
  {
    files: ["**/*.{js,jsx}"],
    extends: [js.configs.recommended],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      expo,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs["recommended-latest"].rules,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]", args: "none" }],
      "expo/no-env-var-destructuring": "error",
      "expo/no-dynamic-env-var": "error",
    },
  },
]);
