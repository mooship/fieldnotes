# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Fieldnotes is a personal site and blog built with Astro (static output), hosted on Cloudflare Pages. The home page renders at `/` and the blog lives at `/blog`.

## Commands

```bash
npm run dev        # start dev server
npm run build      # type-check (astro check) then build
npm run lint       # run ESLint across Astro, TS, CSS, and Markdown with auto-fix
npm run lint:check # same lint, no auto-fix — what CI runs
npm run preview    # preview production build
npm run format     # prettier with auto-fix (also sorts imports, formats package.json)
npm run test       # run Vitest unit tests
npm run lighthouse # run Lighthouse CI against the built site (informational, no score gate)
```

`npm run build` is the primary verification step — it runs `astro check` (TypeScript + Astro type checking) before building. Run `npm run test` to verify utility logic. Both must pass before committing.

Linting uses ESLint flat config with support for Astro, TypeScript, CSS, and Markdown.

## Content authoring

**Adding a blog post:** create `src/content/blog/<slug>.md`. The slug is the filename minus `.md` (e.g. `my-post.md` → `/blog/my-post` — see `getPostSlug` in `src/lib/blog.ts`). Frontmatter schema (`src/content.config.ts`):

- `title: string` — required
- `description: string` — required (used for `<meta description>`, OG/Twitter tags, and the post list excerpt)
- `pubDate` — required, coerced to a `Date`
- `updatedDate` — optional, coerced to a `Date`
- `draft` — optional boolean, defaults to `false`. **`draft: true` silently excludes the post everywhere** — `getBlogPosts()` (`src/lib/blog.ts`) filters it out of the blog index, all three feeds, the sitemap, `llms.txt`, and adjacent-post navigation.

Posts are sorted newest-`pubDate`-first. Reading time, feed entries, and the post's OG image are generated automatically at build time from that one file — nothing else needs updating to publish a post.

**Editing home page sections:** the five `.md` files in `src/sections/` (`intro`, `personal`, `writing`, `opensource`, `support`) are rendered in that order by `src/pages/index.astro`.

**Editing `/now`, `/uses`, or `/colophon`:** edit `src/sections/now.md` / `src/sections/uses.md` / `src/sections/colophon.md` directly — the page files themselves are thin wrappers with no content of their own.

## Tests

Tests use Vitest with happy-dom. Test files live next to the source files they test (`*.test.ts`).

- `src/lib/blog.test.ts` — `getPostSlug`, `getSiteUrl`, `renderMarkdownToHtml`, `getBlogPosts`, `getAdjacentPosts`, `getTocHeadings`, `computeReadingTime`, `formatDate`, `formatMonthYear`
- `src/lib/feed.test.ts` — `getFeedItems`
- `src/lib/xml.test.ts` — `xmlEscape`

`astro:content` is a virtual Astro module that doesn't exist outside the Astro runtime. Tests that import from `src/lib/blog.ts` use `vi.hoisted` + `vi.mock` to intercept it. The alias in `vitest.config.ts` resolves it to `src/__mocks__/astro-content.ts` so Vite can find the module during test runs.

## Lefthook

Lefthook runs a pre-commit hook that executes `lint`, `format`, and `test` on every commit. Configuration is in `lefthook.yml`. The hook auto-fixes and reformats staged files — changed files must be re-staged manually before the commit proceeds. `test` runs the Vitest suite (currently ~1s) and blocks the commit on failure. Run `npx lefthook install` after cloning to activate hooks.

## CI

`.github/workflows/ci.yml` runs on every push and PR to `main`: `lint:check` (no autofix), `build` + `test` on Node 22 and 24, and an informational Lighthouse run (`continue-on-error`, report uploaded as an artifact). Pre-commit hooks cover lint/format/test locally but not `astro check` type-checking — that only runs as part of `npm run build`, which isn't in `lefthook.yml`. Run `npm run build` locally before pushing if you've touched types, or a type error will only surface in CI.

Dependabot (`.github/dependabot.yml`) groups each ecosystem's updates into one PR. Most npm and GitHub Actions dependencies check monthly (first Saturday); `astro` and `zod` are split into their own weekly-grouped PR instead.

## Deployment

The site is hosted on **Cloudflare Pages**. There's no `wrangler.toml` or Pages config committed — build/deploy settings live in the Cloudflare dashboard, not this repo. `public/_headers` is Cloudflare Pages' native way to set response headers (its CSP allows `cloudflareinsights.com` for Cloudflare Web Analytics). Production domain: `timothybrits.co.za` (`site` in `astro.config.mjs`).

`public/_headers` sets security headers (a strict CSP, HSTS, frame/referrer/permissions policy) and cache rules for every response, plus long cache lifetimes for `/_astro/*`, `/og/*`, and static image types. **If you add a new external resource** — a script, font, image, or API call from a new origin — the CSP's `default-src 'self'` will silently block it in production even though it works fine in `npm run dev`. Update the matching `-src` directive in `public/_headers` at the same time.

## Safety

- **Never deploy to production without explicit permission from the user.** Always ask first and wait for confirmation.

## Git commit conventions

- **Never include a `Claude-Session:` link (or any claude.ai/code session URL) in a commit message on this repo.** A trailing `Co-Authored-By: Claude ...` line is fine if included, but omit the session-link trailer entirely — this repo is public and the owner doesn't want session links surfacing in commit history.

## Architecture

**How the home page is assembled:** `src/pages/index.astro` imports five `.md` files as Astro content components and renders them sequentially inside a `<main>`. The markdown files each export a `Content` component via Astro's MD pipeline — they are not routes themselves. A blog section is rendered inline (not from a `.md` file) by querying the content collection.

**Blog:** Posts live in `src/content/blog/` as `.md` files. The collection is defined in `src/content.config.ts` using Astro's `glob()` loader. Shared blog utilities (fetch, sort, slug transform, description constant) are in `src/lib/blog.ts`. Three feed endpoints are generated at build time: `/rss.xml`, `/atom.xml`, `/feed.json` — all share `src/lib/feed.ts` (`getFeedItems`) which renders post HTML and normalises dates. XML character escaping lives in `src/lib/xml.ts`. Individual post pages (`src/pages/blog/[slug].astro`) also render a signal-red reading-progress bar, copy/share buttons, and an auto-generated table of contents (`render()`'s `headings` filtered by `getTocHeadings` in `src/lib/blog.ts`, which returns them only when a post has three or more h2/h3 headings, with scrollspy highlighting via `IntersectionObserver`) — all reinitialized per navigation via `astro:page-load`, see Known Astro quirks.

**SEO/crawler endpoints:** `src/pages/robots.txt.ts` and `src/pages/llms.txt.ts` are dynamically generated at build time (not static files in `public/`) — `robots.txt` points to the sitemap, `llms.txt` lists every page and post as an AI-crawler-friendly Markdown index. Both pull from the same `src/lib/blog.ts` helpers as the rest of the site, so a new post appears in `llms.txt` automatically, and a `draft: true` post is excluded from it too.

**Design system:** Swiss / International Typographic style. Pure black-on-white palette (`--paper` #ffffff light / #0a0a0a dark, `--ink` #0a0a0a / #f2f2f2) with a single hot signal-red accent (`--signal` #e2231a light / #ff453a dark) used for the masthead square mark, the active nav state, blockquote bars, selection fills, and link hover. Links themselves are ink (black), turning signal-red on hover. Sharp corners everywhere (`--radius: 0`), no shadows, hairline rules — plus one heavy 4px ink rule across the top of the masthead. The design relies on a neo-grotesque type system, a strict flush-left ragged-right grid, dramatic size jumps, and one restrained accent — no ornaments, no italics, no section-specific colors.

**Styling:** Styles are split across five files in `src/styles/`: `tokens.css` (CSS custom properties), `base.css` (resets and base element styles), `typography.css` (type scale), `code.css` (code block styles), and `print.css` (`@media print` rules — forces black-on-white regardless of the OS color scheme and appends link URLs). Tokens: `--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--rule`, `--signal`. `--link` aliases to `--ink` (black links) and `--link-hover` aliases to `--signal` so links pick up the red accent on hover. Page-level layout styles use `:global()` selectors in `<style>` blocks — note `print.css` is a plain (non-scoped) stylesheet, so it uses bare selectors, not `:global()`. Light/dark modes are CSS-only via `@media (prefers-color-scheme: dark)` in `tokens.css` — there is no manual toggle component.

**Hiding an element from print:** add the `no-print` class directly to it. `print.css` defines the single rule (`.no-print { display: none !important; }` under `@media print`); every page/component that has interactive chrome not worth printing (nav, footer, share/copy buttons, the reading-progress bar, back-links, the post ToC) applies the class itself rather than `print.css` maintaining a list of every other file's internal class names. Add `no-print` to any new interactive UI the same way — `print.css` never needs to change for it.

**Fonts:** Geist (the neo-grotesque used for everything — body, headings, nav, meta) and Geist Mono (code only). Both are loaded via Astro's font API (`fontProviders.fontsource()`) and exposed as `--font-sans` and `--font-mono` respectively; `--font-sans` carries a system-sans fallback stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, …). There is no serif face. Font-face declarations are injected automatically. Typography details (sizes, weights, letter-spacing) are in `src/styles/typography.css`.

**Markdown plugins:** `remark-smartypants` for smart typography (curly quotes, em-dashes, ellipses) and `rehype-external-links` (adds `rel="noopener noreferrer"` to outbound links). The shared plugin options live in `src/lib/markdown-config.ts` so the Astro pipeline (`astro.config.mjs`) and the feed-rendering pipeline (`src/lib/blog.ts`) stay in sync. Reading time is computed in one place by `computeReadingTime` (`src/lib/blog.ts`), which strips markdown syntax before counting words; both the blog index and individual post pages call it so the estimate is identical everywhere. Syntax highlighting uses Shiki with `min-light`/`min-dark` themes (muted, to suit the monochrome palette).

**Build pipeline:** Astro integrations run at build time — `@astrojs/sitemap` (sitemap generation) and `astro-pagefind` (full-text search index; search UI rendered in the blog index via `astro-pagefind/components/Search`, implemented as a genuine Web Component so it re-initializes correctly across view-transition navigations with no extra glue code). `@astrojs/rss` is used by `rss.xml.ts` for the RSS feed.

**OG images:** `/og/[slug].png.ts` generates Open Graph images at build time using `satori` (SVG layout) and `sharp` (PNG conversion). The layout mirrors the Swiss site design — white field, black flush-left title in Geist, a signal-red accent bar, and a caps masthead label; Geist `.woff` files are read from `@fontsource/geist`.

**Standalone pages:** `/now`, `/uses`, and `/colophon` are static pages (`src/pages/now.astro`, `src/pages/uses.astro`, `src/pages/colophon.astro`) that import their content from the matching `.md` file in `src/sections/`.

**Components:** `src/components/PostListItem.astro` renders a single post row in blog listings. `src/components/CarbonBadge.astro` renders the page carbon footprint badge, computed entirely client-side from the Performance API (no network request) using the Sustainable Web Design Model. `src/components/EasterEggs.astro` holds the Konami-code palette swap and the wordmark click easter egg.

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

**View transitions swap `<body>` without a page reload.** `Layout.astro` renders Astro's `ClientRouter`, so navigating between pages does client-side navigation instead of a full reload. This breaks two common assumptions in inline `<script>` tags:

- `load` and `DOMContentLoaded` only fire once, on the very first hard load — they won't fire again after a client-side navigation. Use the `astro:page-load` event instead; it fires on the initial load *and* after every subsequent navigation. Every inline script in this repo (`EasterEggs.astro`, `CarbonBadge.astro`, `blog/[slug].astro`) follows this pattern.
- Elements not marked `transition:persist` are destroyed and recreated fresh on every navigation, so a listener attached directly to one of them (e.g. the wordmark click handler in `EasterEggs.astro`) is safe to reattach unconditionally on each `astro:page-load` — the old node and its listener are simply gone. But anything bound to `window` or `document` itself *survives* navigation, so re-running that registration on every `astro:page-load` without cleanup stacks a new listener/observer on top of the old one every time. `blog/[slug].astro`'s reading-progress bar (bound to `window`'s `scroll` event and a `ResizeObserver`) guards against this with an `AbortController` aborted at the top of its init function before re-registering.

## Engineering principles

- **Keep it boring and flat.** This is a personal static site with no class hierarchies, no dependency injection, and no plugin system — SOLID/OCP-style abstractions don't have anywhere to attach. Prefer a plain function in `src/lib/` over an interface or a class.
- **Don't duplicate logic across the Astro and feed pipelines.** `src/lib/markdown-config.ts`, `src/lib/blog.ts`, and `src/lib/feed.ts` exist specifically so `astro.config.mjs`, the blog pages, and the three feed endpoints stay in sync — add new shared logic there, not copied inline at each call site.
- **YAGNI over speculative flexibility.** Don't add config options, props, or abstraction layers for a second use case that doesn't exist yet — this site has one author, one design, and one deployment target.
- **New logic in `src/lib/` ships with a test in the same commit.** Every existing file there (`blog.ts`, `feed.ts`, `xml.ts`) has a matching `*.test.ts` — keep that 1:1, and lean on the existing `astro:content` mock rather than inventing a new one.

## Code style

- **No inline comments** — never use trailing `//` comments on the same line as code. JSDoc block comments (`/** */`) are fine where genuinely useful.
- Prettier enforces: double quotes, semicolons, 80-char width. It also runs `prettier-plugin-organize-imports` (auto-sorts imports) and `prettier-plugin-packagejson` (formats `package.json`) as part of `npm run format`.
- ESLint uses flat config (`eslint.config.js`) with TypeScript, Astro (including `jsx-a11y-recommended` — accessibility lint rules apply to `.astro` templates), Unicorn, `@eslint/css`, and `@eslint/markdown`, plus `eslint-config-prettier` to defer all formatting decisions to Prettier. Three Unicorn rules are disabled repo-wide: `filename-case` (needed for `[slug].astro`-style bracket filenames and PascalCase components), `prevent-abbreviations`, and `text-encoding-identifier-case`.
- CSS lint requires new properties/selectors to be **Baseline "newly available"** (`css/use-baseline`) — a very recent CSS feature can get flagged even though it works in current browsers; `text-wrap` and `:selection` are explicitly allowlisted as exceptions.
- `.github/` and `.claude/` are excluded from linting.
