import globals from "globals";
import pluginJs from "@eslint/js";
import pluginJest from "eslint-plugin-jest";

export default [
  {
    ignores: ["node_modules", "dist", "build"],
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    files: ["__tests__/LMS.js"],
    plugins: { jest: pluginJest },
    languageOptions: { globals: globals.jest },
    rules: pluginJest.configs.recommended.rules,
  },
];
