# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Fieldnotes is a personal site and blog built with Astro (static output). The home page renders at `/` and the blog lives at `/blog`.

## Commands

```bash
npm run dev        # start dev server
npm run build      # type-check (astro check) then build
npm run lint       # run ESLint across Astro, TS, CSS, and Markdown with auto-fix
npm run preview    # preview production build
npm run format     # prettier with auto-fix
npm run test       # run Vitest unit tests
```

`npm run build` is the primary verification step — it runs `astro check` (TypeScript + Astro type checking) before building. Run `npm run test` to verify utility logic. Both must pass before committing.

Linting uses ESLint flat config with support for Astro, TypeScript, CSS, and Markdown.

## Tests

Tests use Vitest with happy-dom. Test files live next to the source files they test (`*.test.ts`).

- `src/lib/blog.test.ts` — `getPostSlug`, `getSiteUrl`, `renderMarkdownToHtml`, `getBlogPosts`, `getAdjacentPosts`, `getReadingTime`, `computeReadingTime`, `formatDate`
- `src/lib/feed.test.ts` — `getFeedItems`
- `src/lib/xml.test.ts` — `xmlEscape`
- `src/lib/remark-reading-time.test.ts` — `remarkReadingTime` plugin

`astro:content` is a virtual Astro module that doesn't exist outside the Astro runtime. Tests that import from `src/lib/blog.ts` use `vi.hoisted` + `vi.mock` to intercept it. The alias in `vitest.config.ts` resolves it to `src/__mocks__/astro-content.ts` so Vite can find the module during test runs.

## Lefthook

Lefthook runs a pre-commit hook that executes `lint` and `format` in parallel on every commit. Configuration is in `lefthook.yml`. The hook auto-fixes and reformats staged files — changed files must be re-staged manually before the commit proceeds. Run `npx lefthook install` after cloning to activate hooks.

## Safety

- **Never deploy to production without explicit permission from the user.** Always ask first and wait for confirmation.

## Architecture

**How the home page is assembled:** `src/pages/index.astro` imports five `.md` files as Astro content components and renders them sequentially inside a `<main>`. The markdown files each export a `Content` component via Astro's MD pipeline — they are not routes themselves. A blog section is rendered inline (not from a `.md` file) by querying the content collection.

**Blog:** Posts live in `src/content/blog/` as `.md` files. The collection is defined in `src/content.config.ts` using Astro's `glob()` loader. Shared blog utilities (fetch, sort, slug transform, description constant) are in `src/lib/blog.ts`. Three feed endpoints are generated at build time: `/rss.xml`, `/atom.xml`, `/feed.json` — all share `src/lib/feed.ts` (`getFeedItems`) which renders post HTML and normalises dates. XML character escaping lives in `src/lib/xml.ts`.

**Design system:** Swiss / International Typographic style. Pure black-on-white palette (`--paper` #ffffff light / #0a0a0a dark, `--ink` #0a0a0a / #f2f2f2) with a single hot signal-red accent (`--signal` #e2231a light / #ff453a dark) used for the active nav state, blockquote bars, selection fills, and link hover. Links themselves are ink (black), turning signal-red on hover. Sharp corners everywhere (`--radius: 0`), no shadows, hairline rules. The design relies on a neo-grotesque type system, a strict flush-left ragged-right grid, dramatic size jumps, and one restrained accent — no ornaments, no italics, no section-specific colors.

**Styling:** Styles are split across four files in `src/styles/`: `tokens.css` (CSS custom properties), `base.css` (resets and base element styles), `typography.css` (type scale), and `code.css` (code block styles). Tokens: `--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--rule`, `--signal` / `--signal-hover` / `--signal-tint`. `--link` aliases to `--ink` (black links) and `--link-hover` aliases to `--signal` so links pick up the red accent on hover. Page-level layout styles use `:global()` selectors in `<style>` blocks. Light/dark modes are CSS-only via `@media (prefers-color-scheme: dark)` in `tokens.css` — there is no manual toggle component.

**Fonts:** Geist (the neo-grotesque used for everything — body, headings, nav, meta) and Geist Mono (code only). Both are loaded via Astro's font API (`fontProviders.fontsource()`) and exposed as `--font-sans` and `--font-mono` respectively; `--font-sans` carries a system-sans fallback stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, …). There is no serif face. Font-face declarations are injected automatically. Typography details (sizes, weights, letter-spacing) are in `src/styles/typography.css`.

**Markdown plugins:** `remark-smartypants` for smart typography (curly quotes, em-dashes, ellipses), a custom `remarkReadingTime` plugin (`src/lib/remark-reading-time.ts`) that injects estimated reading time into `remarkPluginFrontmatter.readingTime` for blog posts, and `rehype-external-links` (adds `rel="noopener noreferrer"` to outbound links). Syntax highlighting uses Shiki with `min-light`/`min-dark` themes (muted, to suit the monochrome palette).

**Build pipeline:** Astro integrations run at build time — `@astrojs/sitemap` (sitemap generation) and `astro-pagefind` (full-text search index; search UI rendered in the blog index via `astro-pagefind/components/Search`). `@astrojs/rss` is used by `rss.xml.ts` for the RSS feed.

**OG images:** `/og/[slug].png.ts` generates Open Graph images at build time using `satori` (SVG layout) and `sharp` (PNG conversion). The layout mirrors the Swiss site design — white field, black flush-left title in Inter, a signal-red accent bar, and a caps masthead label; Inter `.woff` files are read from `@fontsource/inter`.

**Standalone pages:** `/now` and `/uses` are static pages (`src/pages/now.astro`, `src/pages/uses.astro`) that import their content from `src/sections/now.md` and `src/sections/uses.md` respectively.

**Components:** `src/components/PostListItem.astro` renders a single post row in blog listings. `src/components/CarbonBadge.astro` renders the page carbon footprint badge.

**SEO:** `Layout.astro` accepts `title`, `description`, `image`, `canonical`, `robots`, and `type` props. It generates Open Graph tags, Twitter card tags, and JSON-LD schema (hand-built, no external package).

## Known Astro quirks

**`:global()` multi-selector lists are silently dropped.** Astro's scoped style compiler discards rules where multiple selectors are listed inside a single `:global()`:

```css
/* ❌ silently dropped at build time — nothing is emitted */
:global(.section-blog, .section-opensource, .section-writing) {
  margin-top: 2.5rem;
}

/* ✅ correct — each selector gets its own :global() */
:global(.section-blog),
:global(.section-opensource),
:global(.section-writing) {
  margin-top: 2.5rem;
}
```

Always use one `:global()` per selector when applying shared styles to multiple global classes.

## Code style

- **No inline comments** — never use trailing `//` comments on the same line as code. JSDoc block comments (`/** */`) are fine where genuinely useful.
- Prettier enforces: double quotes, semicolons, 80-char width
- ESLint uses flat config with TypeScript, Astro, Unicorn, and Prettier integration
