import css from "@eslint/css";
import markdown from "@eslint/markdown";

/**
Biome formats and lints the code. ESLint stays only for the two checks Biome
cannot do: Baseline-only CSS and the Markdown rules.
@type {import("eslint").Linter.Config[]}
*/
export default [
  {
    ignores: [
      "dist/",
      "coverage/",
      ".astro/",
      ".astro-cache/",
      ".github/",
      ".claude/",
    ],
  },
  {
    files: ["**/*.css"],
    language: "css/css",
    plugins: css.configs.recommended.plugins,
    rules: {
      ...css.configs.recommended.rules,
      "css/no-invalid-properties": ["error", { allowUnknownVariables: true }],
      "css/no-important": "off",
      "css/use-baseline": [
        "error",
        {
          available: "newly",
          allowProperties: ["text-wrap"],
          allowSelectors: ["selection"],
        },
      ],
      "css/font-family-fallbacks": "off",
    },
  },
  ...markdown.configs.recommended,
];
