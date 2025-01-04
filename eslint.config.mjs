import globals from "globals";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginReact.configs.flat.recommended,
  {rules: {
    "react/prop-types": "off", // Disable react/prop-types globally
  }}
];