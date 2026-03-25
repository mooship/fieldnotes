# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server
npm run build      # type-check (astro check) then build
npm run lint       # run ESLint across Astro, TS, CSS, and Markdown
npm run lint:fix   # run ESLint with auto-fix
npm run preview    # preview production build
npm run format     # prettier with auto-fix
npm test           # run Vitest unit tests
```

`npm run build` is the primary verification step — it runs `astro check` (TypeScript + Astro type checking) before building. Run `npm test` to verify utility logic. Both must pass before committing.

Linting uses ESLint flat config with support for Astro, TypeScript, CSS, and Markdown.

## Tests

Tests use Vitest with happy-dom. Test files live next to the source files they test (`*.test.ts`).

- `src/lib/blog.test.ts` — `getPostSlug`, `getSiteUrl`, `renderMarkdownToHtml`, `getBlogPosts`
- `src/lib/xml.test.ts` — `xmlEscape`
- `src/lib/remark-reading-time.test.ts` — `remarkReadingTime` plugin

`astro:content` is a virtual Astro module that doesn't exist outside the Astro runtime. Tests that import from `src/lib/blog.ts` use `vi.hoisted` + `vi.mock` to intercept it. The alias in `vitest.config.ts` resolves it to `src/__mocks__/astro-content.ts` so Vite can find the module during test runs.

## Lefthook

Lefthook runs a pre-commit hook that executes `lint:fix` and `format` in parallel on every commit. Configuration is in `lefthook.yml`. The hook auto-fixes and reformats staged files — if it changes files you need to re-stage them before the commit proceeds.

## Architecture

This is a personal/links site with a blog, built with Astro (static output). The home page renders at `/` and the blog lives at `/blog`.

**How the home page is assembled:** `src/pages/index.astro` imports five `.md` files as Astro content components and renders them sequentially inside a `<main>`. The markdown files each export a `Content` component via Astro's MD pipeline — they are not routes themselves. A blog section is rendered inline (not from a `.md` file) by querying the content collection.

**Blog:** Posts live in `src/content/blog/` as `.md` files. The collection is defined in `src/content.config.ts` using Astro's `glob()` loader. Shared blog utilities (fetch, sort, slug transform, description constant) are in `src/lib/blog.ts`. Three feed endpoints are generated at build time: `/rss.xml`, `/atom.xml`, `/feed.json`. XML character escaping lives in `src/lib/xml.ts` and is shared by `atom.xml.ts`.

**Styling:** All base styles and CSS custom properties (colors, fonts) live in `src/styles/global.css`. Page-level layout styles (section spacing, link styles, heading overrides) are in a `<style>` block in `index.astro` using `:global()` selectors to reach markdown-rendered elements. Light and dark modes are handled via `prefers-color-scheme`.

**Fonts:** IBM Plex Mono (headings/mono) and DM Sans Variable (body), configured via Astro's built-in font API (`astro/config` `fontProviders.fontsource()`) with CSS variables `--font-mono` and `--font-dm-sans`. Font-face declarations are injected automatically; the CSS variables are consumed in `global.css`.

**Markdown plugins:** `remark-smartypants` for smart typography (curly quotes, em-dashes, ellipses) and a custom `remarkReadingTime` plugin (`src/lib/remark-reading-time.ts`) that injects estimated reading time into `remarkPluginFrontmatter.readingTime` for blog posts.

**Build pipeline:** Astro integrations run at build time — sitemap generation (`@astrojs/sitemap`) and RSS feeds (`@astrojs/rss`).

**Icons:** Remix Icon via the `remixicon` npm package, imported in `Layout.astro`. Used inline in markdown as `<i class="ri-*">` HTML.

**SEO:** `Layout.astro` accepts `title`, `description`, `image`, `canonical`, `robots`, and `type` props. It generates Open Graph tags, Twitter card tags, and JSON-LD schema (hand-built, no external package).
