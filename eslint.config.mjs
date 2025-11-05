import css from "@eslint/css";
import eslint from "@eslint/js";
import markdown from "@eslint/markdown";
import ts from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier/flat";
import astro from "eslint-plugin-astro";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import yaml from "eslint-plugin-yaml";
import { defineConfig } from "eslint/config";

const jsFiles = ["*.js", "*.mjs"];
const tsFiles = ["*.ts"];
const astroFiles = ["*.astro"];
const cssFiles = ["*.css", "*.astro"];
const yamlFiles = ["*.yaml", "*.yml"];
const markdownFiles = ["*.md"];
const unicornFiles = ["*.js", "*.ts", "*.mjs", "*.astro"];

const jsPlugins = { sonarjs };
const tsPlugins = { "@typescript-eslint": ts, sonarjs };
const astroPlugins = { astro };
const cssPlugins = { css };
const yamlPlugins = { yaml };
const markdownPlugins = { markdown };
const unicornPlugins = { unicorn };

export default defineConfig(
  {
    files: jsFiles,
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: jsPlugins,
    rules: {
      ...eslint.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
    },
  },
  {
    files: tsFiles,
    plugins: tsPlugins,
    rules: {
      ...ts.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
    },
  },
  {
    files: astroFiles,
    plugins: { ...astroPlugins, ...tsPlugins },
    rules: {
      ...astro.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
    },
  },
  {
    files: cssFiles,
    language: "css/css",
    plugins: cssPlugins,
    rules: { ...css.configs.recommended.rules },
  },
  {
    files: yamlFiles,
    language: "yaml/yaml",
    plugins: yamlPlugins,
    rules: { ...yaml.configs.recommended.rules },
  },
  {
    files: markdownFiles,
    language: "markdown/gfm",
    plugins: markdownPlugins,
    rules: { ...markdown.configs.recommended.rules },
  },
  {
    files: unicornFiles,
    plugins: unicornPlugins,
    rules: {
      ...unicorn.configs.recommended.rules,
      "unicorn/filename-case": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
  prettier
);
