import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginReact from "eslint-plugin-react";
import typescriptParser from "@typescript-eslint/parser";
import eslintPluginPrettier from "eslint-plugin-prettier";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...tseslint.configs.recommended,
  {
    plugins: {
      prettier: eslintPluginPrettier,
      react: eslintPluginReact,
    },
    rules: {
      ...eslintPluginReact.configs.recommended.rules,
      "comma-dangle": "off",
      // "@typescript-eslint/comma-dangle": "off",
      "space-before-function-paren": "off",
      // "@typescript-eslint/no-unused-vars": "error",
      // "@typescript-eslint/no-misused-promises": [
      //   "error",
      //   { checksVoidReturn: false },
      // ],
      // "@typescript-eslint/no-base-to-string": "error",
      // "@typescript-eslint/consistent-type-imports": [
      //   "error",
      //   {
      //     prefer: "type-imports",
      //     fixStyle: "inline-type-imports",
      //   },
      // ],
      quotes: [
        "error",
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],
      "prettier/prettier": [
        "error",
        {
          semi: false,
          singleQuote: false,
          trailingComma: "es5",
          tabWidth: 2,
          printWidth: 80,
          arrowParens: "always",
          endOfLine: "auto",
        },
      ],
    },
  },
  {
    files: ['*.js', '*.ts', '*.tsx'],
    languageOptions: {
      // parser: typescriptParser,
      parserOptions: {
        project: true,
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    ignores: [
      "vite.*",
      "dist/",
      "test/",
      "mocks/",
      "assets/",
      ".vscode/",
      ".github/",
      "*.config",
      ".prettierrc.cjs",
      "eslint.config.mjs",
    ],
  },
];
