# AI Agent Guide: Ligaro

High‑impact, project‑specific facts to be productive fast. Keep it lean; optimize for static, accessible output.

## Architecture & Flow

Static Astro 5.x site (no SSR/hydration). Content lives in `bio.md` (Markdown → compiled component export `Content`). `index.astro` imports `Content as BioContent` and wraps it in `Layout`. `Layout.astro` centralizes SEO/meta + JSON‑LD (via `astro-seo-schema` + `schema-dts`) and font/icon imports. Global theming (CSS variables) in `global.css`; page‑scoped adjustments sit in `<style>` of individual `.astro` pages using `:global(...)` so PurgeCSS keeps them.

## Critical Files

`src/pages/bio.md` – Edit links here (lists + headings). Don’t inject heavy JS.
`src/pages/index.astro` – Shell + local card/link styling; preserves variable tokens.
`src/layouts/Layout.astro` – Imports `@fontsource-variable/work-sans`, Remix Icon CSS, builds JSON‑LD; keep prop names (`title`, `description`, etc.) stable.
`src/styles/global.css` – Colour + spacing tokens; dark mode via `prefers-color-scheme` media query.
`astro.config.mjs` – Enables `@playform/inline`, `astro-purgecss`, sitemap, Fontaine transform.

## Scripts (npm)

`dev` (4321) for iteration; `build` runs `astro check` then production; `preview` serves `dist`; `lint` (ESLint + auto‑fix + cache); `format` (Prettier + import sort). Always run `format` → `lint` → `build` before PR.

## Conventions

Content over code: add links by editing Markdown, not by creating arrays in Astro.
Keep export name `Content` in `bio.md` (don’t rename — import pattern used in `index.astro`).
Let Prettier handle import sorting; don’t reorder manually.
Avoid adding client JS or hydration islands — unnecessary overhead.

## Styling & Tokens

Prefer modifying CSS variables in `:root` (or dark mode block) over hardcoded colours. Page styles use `:global` selectors intentionally; retain them so PurgeCSS doesn’t strip needed rules. Icons rely on Remix Icon class names (`ri-*-line`); list items in `bio.md` may include `<i class="ri-github-line"></i>` etc. — maintain semantic structure.

## Performance & SEO

Inline plugin (`@playform/inline`) inlines small assets (<4 KB); keep SVGs tiny to benefit. PurgeCSS demands stable class names; avoid dynamic concatenation. `Layout.astro` sets canonical, Open Graph, Twitter meta, and Schema JSON‑LD — preserve conditional guards when extending.

## Safe Extensibility

New page: `src/pages/<name>.astro` importing `Layout`. Keep JSON‑LD logic minimal (reuse pattern from layout). For structured link metadata later, convert `bio.md` frontmatter to YAML and iterate via Astro collections (future option; don’t pre‑optimize now).

## Pitfalls to Avoid

Breaking Node engine (`>=24.11.0`).
Adding global classes unused → PurgeCSS bloat risk or removal mismatch.
Inlining large assets (won’t inline; just increases bundle config churn).
Removing font import from `Layout` (breaks self‑hosted chain + Fontaine fallback).

## Quick Actions

Add link: append to list in `bio.md`:
`- My Blog: https://example.org/`
Add page example (minimal):

```astro
---
import Layout from "../layouts/Layout.astro";
---

<Layout title="About" description="About page">
  <main>
    <h1>About</h1>
    <p>Short bio...</p>
  </main>
</Layout>
```

## Agent Playbook (PR Prep)

1. Edit Markdown / styles.
2. Run format → lint.
3. Build (auto type check) + optional preview.
4. Verify diff (no accidental class renames, font removal, meta regression).

Request clarification if adding tests, deployment config, or data structuring beyond current scope.
