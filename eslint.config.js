import css from "@eslint/css";
import markdown from "@eslint/markdown";
import prettierConfig from "eslint-config-prettier";
import astroPlugin from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["dist/", ".astro/", ".astro-cache/", ".github/", ".claude/"],
  },
  ...tseslint.configs.recommended,
  ...astroPlugin.configs.recommended,
  css.configs.recommended,
  ...markdown.configs.recommended,
  prettierConfig,
];
