# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server
npm run build      # type-check (astro check) then build
npm run preview    # preview production build
npm run format     # prettier with auto-fix
```

There are no tests. `npm run build` is the verification step — it runs `astro check` (TypeScript + Astro type checking) before building.

## Architecture

This is a personal/links site with a blog, built with Astro (static output). The home page renders at `/` and the blog lives at `/blog`.

**How the home page is assembled:** `src/pages/index.astro` imports five `.md` files as Astro content components and renders them sequentially inside a `<main>`. The markdown files each export a `Content` component via Astro's MD pipeline — they are not routes themselves. A blog section is rendered inline (not from a `.md` file) by querying the content collection.

**Blog:** Posts live in `src/content/blog/` as `.md` files. The collection is defined in `src/content.config.ts` using Astro's `glob()` loader. Shared blog utilities (fetch, sort, slug transform, description constant) are in `src/lib/blog.ts`. Three feed endpoints are generated at build time: `/rss.xml`, `/atom.xml`, `/feed.json`.

**Styling:** All base styles and CSS custom properties (colors, fonts) live in `src/styles/global.css`. Page-level layout styles (section spacing, link styles, heading overrides) are in a `<style>` block in `index.astro` using `:global()` selectors to reach markdown-rendered elements. Light and dark modes are handled via `prefers-color-scheme`.

**Fonts:** IBM Plex Mono (headings/mono) and DM Sans Variable (body), configured via Astro's built-in font API (`astro/config` `fontProviders.fontsource()`) with CSS variables `--font-mono` and `--font-dm-sans`. Font-face declarations are injected automatically; the CSS variables are consumed in `global.css`.

**Markdown plugins:** `remark-smartypants` for smart typography (curly quotes, em-dashes, ellipses) and a custom `remarkReadingTime` plugin (`src/lib/remark-reading-time.ts`) that injects estimated reading time into `remarkPluginFrontmatter.readingTime` for blog posts.

**Build pipeline:** Astro integrations run at build time — sitemap generation (`@astrojs/sitemap`) and RSS feeds (`@astrojs/rss`).

**Icons:** Remix Icon via the `remixicon` npm package, imported in `Layout.astro`. Used inline in markdown as `<i class="ri-*">` HTML.

**SEO:** `Layout.astro` accepts `title`, `description`, `image`, `canonical`, `robots`, and `type` props. It generates Open Graph tags, Twitter card tags, and JSON-LD schema (hand-built, no external package).
