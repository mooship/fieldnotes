# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

Fieldnotes is a personal site and blog built with Astro, hosted on Cloudflare Workers via the `@astrojs/cloudflare` adapter. The home page renders at `/` and the blog lives at `/blog`. Almost every page is still prerendered to static HTML at build time (`output: "static"`) — the one exception is `/api/guestbook`, an on-demand route backed by D1 that powers the guestbook at `/1999/guestbook`.

## Commands

```bash
pnpm dev           # start dev server (wrangler types, then astro dev)
pnpm build         # wrangler types, type-check (astro check), then build
pnpm lint          # run ESLint across Astro, TS, CSS, and Markdown with auto-fix
pnpm lint:check    # same lint, no auto-fix — what CI runs
pnpm preview       # build, then run the built Worker locally with `wrangler dev` (real bindings, not astro preview)
pnpm deploy        # build, then `wrangler deploy` — never run without the user's explicit go-ahead, see Safety
pnpm format        # prettier with auto-fix (also sorts imports, formats package.json)
pnpm test          # run Vitest unit tests
pnpm test:coverage # run Vitest with coverage — CI fails under 100% lines/branches/functions/statements in src/lib
pnpm lighthouse    # run Lighthouse CI against the built site (informational, no score gate)
```

`pnpm build` is the primary verification step — it regenerates Cloudflare binding types (`wrangler types --include-runtime=false`) and runs `astro check` (TypeScript + Astro type checking) before building. Run `pnpm test` to verify utility logic. Both must pass before committing. `wrangler types` is run with `--include-runtime=false`: the full runtime type set pulls in Cloudflare's `HTMLRewriter` `Element` type, which collides with DOM's `Element.append` and breaks type-checking on every client-side `<script>` block in the project. With runtime types off, `Env` is still generated (used by the guestbook API route), and `cloudflare:workers`'s minimal type is declared by hand in `src/environment.d.ts`.

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
- `src/lib/guestbook.test.ts` — `normalizeGuestbookInput`
- `src/lib/guestbook-database.test.ts` — `listGuestbookEntries`, `insertGuestbookEntry`, against a fake object implementing D1's `prepare`/`bind`/`all`/`run` chain (no real D1 binding needed for unit tests)
- `src/lib/turnstile.test.ts` — `isTurnstileTokenValid`, against a fake `fetch` (and, for the no-verifier path, `vi.stubGlobal("fetch", ...)`)
- `src/lib/easter-eggs.test.ts` — `incrementSessionCount`
- `src/lib/command-palette.test.ts` — `filterCommandPaletteItems`

`astro:content` is a virtual Astro module that doesn't exist outside the Astro runtime. Tests that import from `src/lib/blog.ts` use `vi.hoisted` + `vi.mock` to intercept it. The alias in `vitest.config.ts` resolves it to `src/__mocks__/astro-content.ts` so Vite can find the module during test runs.

**Coverage:** `vitest.config.ts` configures `@vitest/coverage-v8` scoped to `src/lib/**/*.ts` (`all: true`, so a new file with no test shows up as 0% rather than being silently excluded) with lines/branches/functions/statements thresholds all set to 100. `pnpm test:coverage` runs it locally; CI runs it as part of the `ci` job (replacing the plain `pnpm test`) on both Node versions. Astro components, pages, and layouts are deliberately out of scope — they need the Astro/browser runtime to execute meaningfully, which is what manual browser verification and Lighthouse are for, not Vitest. Keep coverage at 100% by writing the missing test case, not by carving out an exclusion or reaching for a `/* v8 ignore */` comment — those should stay rare enough to need justifying on sight.

## Lefthook

Lefthook runs a pre-commit hook that executes `lint`, `format`, and `test` on every commit. Configuration is in `lefthook.yml`. The hook auto-fixes and reformats staged files — changed files must be re-staged manually before the commit proceeds. `test` runs the Vitest suite (currently ~1s) and blocks the commit on failure. Run `pnpm exec lefthook install` after cloning to activate hooks.

## CI

`.github/workflows/ci.yml` runs on every push and PR to `main`: `lint:check` (no autofix), `build` + `test:coverage` on Node 22 and 24, and an informational Lighthouse run (`continue-on-error`, report uploaded as an artifact). `test:coverage` fails the job if coverage in `src/lib` drops below 100% on any metric — see Tests. Pre-commit hooks cover lint/format/test locally but not `astro check` type-checking or coverage — those only run as part of `pnpm build`/`pnpm test:coverage`, neither of which is in `lefthook.yml` (coverage instrumentation adds overhead not worth paying on every commit). Run `pnpm build` and `pnpm test:coverage` locally before pushing if you've touched types or `src/lib`, or a failure will only surface in CI.

Dependabot (`.github/dependabot.yml`) groups each ecosystem's updates into one PR. Most npm and GitHub Actions dependencies check monthly (first Saturday); `astro` and `zod` are split into their own weekly-grouped PR instead.

## Deployment

The site is hosted on **Cloudflare Workers** (`@astrojs/cloudflare` adapter, migrated off Cloudflare Pages). `wrangler.jsonc` at the project root is the source of truth. Deployment **is** Git-integrated via Cloudflare Workers Builds: **a push to `main` automatically builds and deploys to production**, and a push to any other branch (including a PR branch) gets its own isolated preview deployment at a `<hash>-fieldnotes.timothybrits.workers.dev` URL, posted as a PR comment by the `cloudflare-workers-and-pages` bot. `pnpm deploy` (build, then `wrangler deploy`) still works as a manual CLI alternative, but **merging a PR to `main` is itself a production deploy** — treat it with the same caution as running `wrangler deploy` directly, see Safety. Production domain: `timothybrits.co.za` (`site` in `astro.config.mjs`).

Astro's build produces `dist/client` (static assets) and `dist/server` (the Worker script). `wrangler.jsonc`'s `main` points at `@astrojs/cloudflare/entrypoints/server` and `assets.directory` at `./dist/client` — the adapter also writes its own `dist/server/wrangler.json` mirroring the root config with paths relativized to `dist/server`; that's a build artifact for the adapter's own tooling, not something to edit or deploy from directly.

**Bindings** (all declared in `wrangler.jsonc`, typed via `wrangler types` into `worker-configuration.d.ts`, accessed in server code via `import { env } from "cloudflare:workers"`):

- `DB` — a D1 database (`fieldnotes-guestbook`, provisioned in the `weur` region) backing the guestbook. Schema lives in `migrations/`; apply with `wrangler d1 migrations apply fieldnotes-guestbook --local` (dev) or `--remote` (production — production data, treat like a deploy, see Safety).
- `GUESTBOOK_RATE_LIMITER` — Cloudflare's native Rate Limiting binding, capping guestbook POSTs at 5 per client IP per 60-second window (the only supported period granularity is 10 or 60 seconds).
- `ASSETS` — the static assets binding serving everything under `dist/client`.
- `TURNSTILE_SECRET_KEY` — a Cloudflare Turnstile secret, used server-side to verify guestbook submissions aren't bots. Not in `wrangler.jsonc` (secrets never are): set locally in `.dev.vars` (gitignored), in production via `wrangler secret put TURNSTILE_SECRET_KEY`. The matching public site key is `PUBLIC_TURNSTILE_SITE_KEY`, a build-time Astro env var (`.env` / `.env.production`, both gitignored) rendered into the guestbook page's Turnstile widget.

Two adapter features are deliberately turned off in `astro.config.mjs` rather than left at their defaults: `session: false` (the site has no per-user state, so there's no reason to provision a KV namespace for Astro's Sessions API) and `imageService: "passthrough"` (the site doesn't use `astro:assets`' `<Image>`/`getImage()` — only its `Font` API — so there's no reason to provision a Cloudflare Images binding). Both would otherwise be auto-provisioned on deploy.

**Observability, Smart Placement:** `wrangler.jsonc` sets `observability.enabled: true` (Workers Logs, and live tailing via `wrangler tail` once deployed) and `placement.mode: "smart"` (Cloudflare picks the Worker's execution location per request; takes up to ~15 minutes after deploy to start taking effect).

`public/_headers` is unchanged from the Pages days — Workers with static assets supports `_headers`/`_redirects` natively, same syntax. It sets security headers (a strict CSP, HSTS, frame/referrer/permissions policy) and cache rules for every response, plus long cache lifetimes for `/_astro/*`, `/og/*`, and static image types. **If you add a new external resource** — a script, font, image, or API call from a new origin — the CSP's `default-src 'self'` will silently block it in production even though it works fine in `pnpm dev`. Update the matching `-src` directive in `public/_headers` at the same time.

## Safety

- **Never deploy to production without explicit permission from the user.** Always ask first and wait for confirmation. This covers `wrangler deploy`/`pnpm deploy`, **merging a PR into `main`** (Cloudflare Workers Builds auto-deploys on every push there — confirm this is still true before assuming otherwise), and anything else that changes the live Worker or its production data — including `wrangler d1 migrations apply --remote` and other `--remote`-flagged wrangler commands against the production D1 database.

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

**Guestbook:** `/1999/guestbook` is part of the `/1999` retro easter-egg section, styled by `Layout1999.astro`. Its form and entry list are plain client-side `fetch` calls to `/api/guestbook` (`src/pages/api/guestbook.ts`, the site's only on-demand route — `export const prerender = false`). Validation (trim, length caps, reject-if-empty) is `normalizeGuestbookInput` in `src/lib/guestbook.ts`, shared so the API route doesn't duplicate it; D1 access is `src/lib/guestbook-database.ts` (`listGuestbookEntries`, `insertGuestbookEntry`), typed against a structural `GuestbookDatabase` interface rather than D1's own types so it can be unit-tested with a fake in `guestbook-database.test.ts` instead of a real binding. `POST` checks the `GUESTBOOK_RATE_LIMITER` binding, then verifies a Cloudflare Turnstile token (`verifyTurnstileToken` in `src/lib/turnstile.ts`, against the `TURNSTILE_SECRET_KEY` secret) before validating and inserting; `GET` lists entries newest-first (capped at `MAX_ENTRIES`). The Turnstile widget itself is rendered client-side in `guestbook.astro` against the public `PUBLIC_TURNSTILE_SITE_KEY` env var (baked in at build time, since this is otherwise a fully static page) — its hidden `cf-turnstile-response` input lives inside the `<form>`, so it's picked up by the existing `FormData` read alongside name/message. The three seed entries (trace / anonymous / mico) live in `migrations/0001_create_guestbook_entries.sql` with backdated `created_at` values rather than as markup in the page.

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

**Prerendering runs inside a `workerd` sandbox by default, not Node.** Since Astro 6 / `@astrojs/cloudflare` v13, prerendered (static) pages are built by actually executing the Worker inside a `workerd`/Miniflare sandbox to match production as closely as possible — not plain Node, even though the output is 100% static HTML. Any prerendered route that depends on a native addon (`sharp`) or other `workerd`-incompatible Node/npm code will fail the build with an unhelpful `No such module` or WASM-compile error, even though it worked fine before the adapter was added. `astro.config.mjs` sets `adapter: cloudflare({ prerenderEnvironment: "node" })` for exactly this reason — `/og/[slug].png.ts` uses `sharp`. On-demand routes (`prerender = false`, i.e. `/api/guestbook`) always run in `workerd` regardless of this setting, since that's the real production runtime for them.

## Engineering principles

- **Keep it boring and flat.** This is a personal static site with no class hierarchies, no dependency injection, and no plugin system — SOLID/OCP-style abstractions don't have anywhere to attach. Prefer a plain function in `src/lib/` over an interface or a class.
- **Don't duplicate logic across the Astro and feed pipelines.** `src/lib/markdown-config.ts`, `src/lib/blog.ts`, and `src/lib/feed.ts` exist specifically so `astro.config.mjs`, the blog pages, and the three feed endpoints stay in sync — add new shared logic there, not copied inline at each call site.
- **YAGNI over speculative flexibility.** Don't add config options, props, or abstraction layers for a second use case that doesn't exist yet — this site has one author, one design, and one deployment target.
- **TDD: new logic in `src/lib/` ships with a test in the same commit, written first.** Every existing file there (`blog.ts`, `feed.ts`, `xml.ts`) has a matching `*.test.ts` — keep that 1:1, write the failing test before the implementation, and lean on the existing `astro:content` mock rather than inventing a new one.

## Code Style

- **No inline comments** — never use trailing `//` comments on the same line as code. JSDoc block comments (`/** */`) are fine where genuinely useful.
- **British English spelling** in site copy and UI labels (section markdown, blog posts, nav/meta text) — "colour", "optimise", "favourite" — matching the author's other projects.
- Prettier enforces: double quotes, semicolons, 80-char width. It also runs `prettier-plugin-organize-imports` (auto-sorts imports) and `prettier-plugin-packagejson` (formats `package.json`) as part of `pnpm format`.
- ESLint uses flat config (`eslint.config.js`) with TypeScript, Astro (including `jsx-a11y-recommended` — accessibility lint rules apply to `.astro` templates), Unicorn, `@eslint/css`, and `@eslint/markdown`, plus `eslint-config-prettier` to defer all formatting decisions to Prettier. Three Unicorn rules are disabled repo-wide: `filename-case` (needed for `[slug].astro`-style bracket filenames and PascalCase components), `prevent-abbreviations`, and `text-encoding-identifier-case`.
- CSS lint requires new properties/selectors to be **Baseline "newly available"** (`css/use-baseline`) — a very recent CSS feature can get flagged even though it works in current browsers; `text-wrap` and `:selection` are explicitly allowlisted as exceptions.
- `.github/` and `.claude/` are excluded from linting.
