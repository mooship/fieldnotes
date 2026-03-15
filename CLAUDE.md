# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server
npm run build      # type-check (astro check) then build
npm run preview    # preview production build
npm run lint       # oxlint with auto-fix
npm run format     # prettier with auto-fix
```

There are no tests. `npm run build` is the verification step — it runs `astro check` (TypeScript + Astro type checking) before building.

## Architecture

This is a single-page personal/links site built with Astro (static output). The entire site renders as one page at `/`.

**How the page is assembled:** `src/pages/index.astro` imports four `.md` files as Astro content components and renders them sequentially inside a `<main>`. The markdown files each export a `Content` component via Astro's MD pipeline — they are not routes themselves.

**Styling:** All base styles and CSS custom properties (colors, fonts) live in `src/styles/global.css`. Page-level layout styles (section spacing, link styles, heading overrides) are in a `<style>` block in `index.astro` using `:global()` selectors to reach markdown-rendered elements. Light and dark modes are handled via `prefers-color-scheme`.

**Fonts:** Lora Variable (headings) and DM Sans Variable (body), configured via Astro's built-in font API (`astro/config` `fontProviders.fontsource()`) with CSS variables `--font-lora` and `--font-dm-sans`. Font-face declarations are injected automatically; the CSS variables are consumed in `global.css`.

**Build pipeline:** Astro integrations run at build time — sitemap generation, CSS/JS inlining (`@playform/inline`), PurgeCSS (removes unused styles), and Brotli/gzip compression (`astro-compressor`). Fontaine runs as a Vite plugin to inject metric-matched fallback fonts.

**Icons:** Remix Icon via the `remixicon` npm package, imported in `Layout.astro`. Used inline in markdown as `<i class="ri-*">` HTML.

**SEO:** `Layout.astro` accepts `title`, `description`, `image`, `canonical`, `robots`, and `type` props. It generates Open Graph tags, Twitter card tags, and JSON-LD schema via `astro-seo-schema`.
