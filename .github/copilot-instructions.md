# AI Agent Guide: Ligaro

High‑impact, project‑specific facts to be productive fast. Keep it lean; optimise for static, accessible output.

## Language Conventions

**Use British English spelling throughout all documentation, commit messages, and user-facing content.** Examples: colour (not color), organise (not organize), optimise (not optimize), centre (not center), licence (not license as noun), analyse (not analyze).

## Architecture & Flow

Static Astro 5.x site (no SSR/hydration). Content is organised into multiple Markdown files: `intro.md`, `personal.md`, `writing.md`, and `support.md` (each exports compiled component `Content`). `index.astro` imports these as `IntroContent`, `PersonalContent`, `WritingContent`, and `SupportContent` and wraps them in `Layout`. `Layout.astro` centralises SEO/meta + JSON‑LD (via `astro-seo-schema` + `schema-dts`) and font/icon imports. Global theming (CSS variables) in `global.css`; page‑scoped adjustments sit in `<style>` of individual `.astro` pages using `:global(...)` so PurgeCSS keeps them.

## Critical Files

`src/pages/intro.md` – Main introduction section with name and bio.
`src/pages/personal.md` – Personal links and social profiles.
`src/pages/writing.md` – Writing and content links.
`src/pages/support.md` – Support and contact information.
`src/pages/index.astro` – Shell importing all content sections + local styling; preserves variable tokens.
`src/layouts/Layout.astro` – Imports `@fontsource-variable/inter`, Remix Icon CSS, builds JSON‑LD; keep prop names (`title`, `description`, etc.) stable.
`src/styles/global.css` – Colour + spacing tokens; dark mode via `prefers-color-scheme` media query.
`astro.config.mjs` – Enables `@playform/inline`, `astro-purgecss`, `astro-compressor`, sitemap, Fontaine transform.

## Scripts (npm)

`dev` (4321) for iteration; `build` runs `astro check` then production; `preview` serves `dist`; `lint` (oxlint + auto‑fix); `format` (Prettier + import sort + package.json). Always run `format` → `lint` → `build` before PR.

## Conventions

Content over code: add links by editing Markdown files, not by creating arrays in Astro.
Keep export name `Content` in all `.md` files (don't rename — import pattern used in `index.astro`).
Let Prettier handle import sorting; don't reorder manually.
Avoid adding client JS or hydration islands — unnecessary overhead.
Each content section lives in its own Markdown file for modularity.
Never write code comments — code should be self‑documenting through clear naming and structure.

## Styling & Tokens

Prefer modifying CSS variables in `:root` (or dark mode block) over hardcoded colours. Page styles use `:global` selectors intentionally; retain them so PurgeCSS doesn't strip needed rules. Icons rely on Remix Icon class names (`ri-*-line`); list items in Markdown files may include `<i class="ri-github-line"></i>` etc. — maintain semantic structure.

## Performance & SEO

Inline plugin (`@playform/inline`) inlines small assets (<4 KB); keep SVGs tiny to benefit. `astro-compressor` optimises final output. PurgeCSS demands stable class names; avoid dynamic concatenation. `Layout.astro` sets canonical, Open Graph, Twitter meta, and Schema JSON‑LD — preserve conditional guards when extending.

## Safe Extensibility

New content section: add `src/pages/<name>.md` with `Content` export, import into `index.astro`.
New page: `src/pages/<name>.astro` importing `Layout`. Keep JSON‑LD logic minimal (reuse pattern from layout). For structured link metadata later, convert Markdown frontmatter to YAML and iterate via Astro collections (future option; don't pre‑optimise now).

## Pitfalls to Avoid

Breaking Node engine (`>=22.21.1`).
Adding global classes unused → PurgeCSS bloat risk or removal mismatch.
Inlining large assets (won't inline; just increases bundle config churn).
Removing font import from `Layout` (breaks self‑hosted Inter chain + Fontaine fallback).

## Quick Actions

Add link: append to appropriate list in `personal.md`, `writing.md`, or `support.md`:
`- [My Blog](https://example.org/) <i class="ri-external-link-line"></i>`
Add new content section: create `src/pages/<section>.md`, export `Content`, import into `index.astro`.
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
