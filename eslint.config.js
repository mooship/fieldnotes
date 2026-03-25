import css from "@eslint/css";
import markdown from "@eslint/markdown";
import prettierConfig from "eslint-config-prettier";
import astroPlugin from "eslint-plugin-astro";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["dist/", ".astro/", ".astro-cache/", ".github/", ".claude/"],
  },
  ...tseslint.configs.recommended,
  ...astroPlugin.configs.recommended,
  {
    ...unicorn.configs["flat/recommended"],
    files: ["**/*.{js,mjs,ts,astro}"],
    rules: {
      ...unicorn.configs["flat/recommended"].rules,
      "unicorn/filename-case": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/text-encoding-identifier-case": "off",
    },
  },
  css.configs.recommended,
  ...markdown.configs.recommended,
  prettierConfig,
];
