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

- `src/lib/blog.test.ts` — `getPostSlug`, `getSiteUrl`, `renderMarkdownToHtml`, `getBlogPosts`
- `src/lib/xml.test.ts` — `xmlEscape`
- `src/lib/remark-reading-time.test.ts` — `remarkReadingTime` plugin

`astro:content` is a virtual Astro module that doesn't exist outside the Astro runtime. Tests that import from `src/lib/blog.ts` use `vi.hoisted` + `vi.mock` to intercept it. The alias in `vitest.config.ts` resolves it to `src/__mocks__/astro-content.ts` so Vite can find the module during test runs.

## Lefthook

Lefthook runs a pre-commit hook that executes `lint` and `format` in parallel on every commit. Configuration is in `lefthook.yml`. The hook auto-fixes and reformats staged files — changed files must be re-staged manually before the commit proceeds. Run `npx lefthook install` after cloning to activate hooks.

## Safety

- **Never deploy to production without explicit permission from the user.** Always ask first and wait for confirmation.

## Architecture

**How the home page is assembled:** `src/pages/index.astro` imports five `.md` files as Astro content components and renders them sequentially inside a `<main>`. The markdown files each export a `Content` component via Astro's MD pipeline — they are not routes themselves. A blog section is rendered inline (not from a `.md` file) by querying the content collection.

**Blog:** Posts live in `src/content/blog/` as `.md` files. The collection is defined in `src/content.config.ts` using Astro's `glob()` loader. Shared blog utilities (fetch, sort, slug transform, description constant) are in `src/lib/blog.ts`. Three feed endpoints are generated at build time: `/rss.xml`, `/atom.xml`, `/feed.json`. XML character escaping lives in `src/lib/xml.ts` and is shared by `atom.xml.ts`.

**Design system:** Simple, timeless, single-accent look. Warm paper/ink palette (`--paper` #f5efe1 light / #1a1813 dark, `--ink` #1f1a10 / #e8dfc9) with a single moss green accent (`--moss` #5d6e33 / #9fb06a) used for links, tags, and hover states. No section-specific colors, no ornaments — the design relies on typography, whitespace, and one restrained accent.

**Styling:** All base styles and CSS custom properties live in `src/styles/global.css`. Tokens: `--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--rule`, `--moss` / `--moss-hover` / `--moss-tint`. `--link` and `--link-hover` alias to `--moss` so every `var(--link)` call site picks up the accent. Page-level layout styles use `:global()` selectors in `<style>` blocks. Light/dark modes via a `data-theme` attribute toggled by `src/components/ThemeToggle.astro` and persisted in `localStorage`.

**Fonts:** Fraunces serif (body/headings) and system sans (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, …) for nav, meta, and tags. Fraunces is loaded via Astro's font API (`fontProviders.fontsource()`) and exposed as `--font-serif`; the sans stack lives in `--font-sans`. Font-face declarations are injected automatically. Typography details (sizes, weights, letter-spacing) are in `src/styles/global.css`.

**Markdown plugins:** `remark-smartypants` for smart typography (curly quotes, em-dashes, ellipses) and a custom `remarkReadingTime` plugin (`src/lib/remark-reading-time.ts`) that injects estimated reading time into `remarkPluginFrontmatter.readingTime` for blog posts. Syntax highlighting uses Shiki with `min-light`/`min-dark` themes.

**Build pipeline:** Astro integrations run at build time — sitemap generation (`@astrojs/sitemap`) and RSS feeds (`@astrojs/rss`).

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
