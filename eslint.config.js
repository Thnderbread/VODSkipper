import globals from "globals";
import tseslint from "typescript-eslint";
import typescriptParser from '@typescript-eslint/parser'
import eslintPluginPrettier from "eslint-plugin-prettier";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...tseslint.configs.recommended,
  {
    settings: {
      react: {
        version: "detect"
      }
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
      react: reactRecommended.plugins.react,
    },
    rules: {
      ...reactRecommended.rules,
      "comma-dangle": "off",
      "@typescript-eslint/comma-dangle": "off",
      "space-before-function-paren": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false },
      ],
      "@typescript-eslint/no-base-to-string": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
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
          singleQuote: false,
          semi: false,
          tabWidth: 2,
          printWidth: 80,
          endOfLine: "auto",
          arrowParens: "always",
          trailingComma: "es5",
        },
      ],
    },
  },
  {
    ignores: [
      "*.cjs",
      "vite.*",
      "dist/",
      "test/",
      "mocks/",
      "assets/",
      ".vscode/",
      ".github/",
      "*.config",
      "wdio.*.ts",
      "eslint.config.js",
    ],
  },
];
