# Copilot Instructions — Ligaro

Personal link-tree + blog site. Astro 6, static output, TypeScript, no test suite.

## Commands

| Command           | Purpose                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| `npm run dev`     | Dev server at `localhost:4321`                                         |
| `npm run build`   | **Verification step** — runs `astro check` (type checking) then builds |
| `npm run format`  | Prettier with import sorting (auto-fix)                                |
| `npm run preview` | Preview production build                                               |

> There are no tests. Always run `npm run build` to verify changes.

## Architecture

### Home page (`/`)

`src/pages/index.astro` imports five `.md` files as Astro content components and renders them in order:

```
src/sections/intro.md
src/sections/personal.md
src/sections/writing.md
src/sections/opensource.md
src/sections/support.md
```

These are **not routes** — they're imported and rendered as `<Content />` components inside `<main>`. A blog section is rendered inline by querying the content collection directly.

### Blog (`/blog`)

- Posts: `src/content/blog/*.md`
- Collection defined in `src/content.config.ts` using Astro's `glob()` loader
- Shared utilities (fetch, sort, slug transform): `src/lib/blog.ts`
- Feed endpoints generated at build time: `/rss.xml`, `/atom.xml`, `/feed.json`
- Reading time injected via `remarkReadingTime` plugin → `remarkPluginFrontmatter.readingTime`

### Styling

- CSS custom properties and base styles: `src/styles/global.css`
- Light/dark mode: `prefers-color-scheme` media query, no JS
- Page-level overrides: `<style>` block in `index.astro` using `:global()` selectors to reach markdown-rendered elements
- Fonts: IBM Plex Mono (`--font-mono`, headings/code) and DM Sans Variable (`--font-dm-sans`, body) via Astro font API — **do not add `@font-face` manually**

### Layout & SEO

`src/layouts/Layout.astro` accepts: `title`, `description`, `image`, `canonical`, `robots`, `type`

- Generates OG tags, Twitter card, and JSON-LD schema (hand-built, no library)

### Icons

Remix Icon via `remixicon` npm package. Use `<i class="ri-*" />` inline in markdown or Astro files.

## Key Conventions

- **Static output only** (`output: "static"` in `astro.config.mjs`) — no server endpoints or SSR
- **Trailing slash**: `never` — all internal links must omit trailing slash
- Markdown gets smart typography automatically via `remark-smartypants` (curly quotes, em-dashes, ellipses)
- TypeScript is enabled; `astro check` runs as part of build
- Experimental Rust compiler is enabled (`experimental.rustCompiler: true`)

## Common Pitfalls

- **Don't add routes for section content** — `src/sections/*.md` files are imported as components, not pages
- **Don't edit `src/sections/writing.md` for blog posts** — blog posts go in `src/content/blog/`
- **Font changes go through `astro.config.mjs`** — the Astro font API injects `@font-face` automatically; don't duplicate in CSS
- `npm run build` is the only verification step — if `astro check` fails, the build fails

## File Map

```
astro.config.mjs          # Site config, fonts, integrations, markdown plugins
src/
  content.config.ts       # Blog collection definition
  layouts/Layout.astro    # Base layout (SEO, fonts, icons)
  pages/
    index.astro           # Home page — imports sections, renders blog list
    blog/[slug].astro     # Blog post route
    blog/index.astro      # Blog index
    rss.xml.ts / atom.xml.ts / feed.json.ts  # Feed endpoints
  sections/               # Home page content (imported as Astro components)
  content/blog/           # Blog posts (.md)
  lib/
    blog.ts               # Blog helpers
    remark-reading-time.ts# Reading time remark plugin
  styles/global.css       # All base styles and CSS variables
```
