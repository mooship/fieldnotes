# AGENTS.md

Instructions for anyone, human or AI, working on this repository. `CLAUDE.md` imports this file; put shared rules here.

## About

Timothy Brits is a personal site and blog built with Astro, hosted on Cloudflare Workers via the `@astrojs/cloudflare` adapter. Public branding uses the author's full name; repository, Worker, database and existing browser-storage identifiers retain `fieldnotes`. The home page renders at `/` and the blog lives at `/blog`. Almost every page is prerendered (`output: "static"`); `/api/guestbook` is the on-demand D1-backed exception for `/1999/guestbook`.

## Commands

```bash
npm run dev           # start dev server (wrangler types, then astro dev)
npm run build         # wrangler types, type-check (astro check), then build
npm run lint          # run ESLint across Astro, TS, CSS, and Markdown with auto-fix
npm run lint:check    # same lint, no auto-fix — what CI runs
npm run preview       # build, then run the built Worker locally with `wrangler dev` (real bindings, not astro preview)
npm run deploy        # build, then `wrangler deploy` — never run without the user's explicit go-ahead, see Safety
npm run format        # prettier with auto-fix (also sorts imports, formats package.json)
npm test              # run Vitest unit tests
npm run test:coverage # run Vitest with coverage — CI fails under 100% lines/branches/functions/statements in src/lib
npm run test:e2e      # run Playwright against the built Worker (`npm run preview` on port 8788); also runs in CI
npm run lighthouse    # run Lighthouse CI against the built site (informational, no score gate)
```

`npm run build` is the primary verification step — it regenerates Cloudflare binding types (`wrangler types --include-runtime=false`) and runs `astro check` (TypeScript + Astro type checking) before building. Run `npm test` to verify utility logic. Both must pass before committing. `wrangler types` is run with `--include-runtime=false`: the full runtime type set pulls in Cloudflare's `HTMLRewriter` `Element` type, which collides with DOM's `Element.append` and breaks type-checking on every client-side `<script>` block in the project. With runtime types off, `Env` is still generated (used by the guestbook API route), and `cloudflare:workers`'s minimal type is declared by hand in `src/environment.d.ts`.

Linting uses ESLint flat config with support for Astro, TypeScript, CSS, and Markdown.

Keep TypeScript on version 6 and retain `astro check`; the native TS 7 compiler does not replace Astro template checking or the JavaScript compiler API used by current lint/format tooling.

## Content authoring

**Adding a blog post:** create `src/content/blog/<slug>.md`. The slug is the filename minus `.md` (e.g. `my-post.md` → `/blog/my-post` — see `getPostSlug` in `src/lib/blog.ts`). Frontmatter schema (`src/content.config.ts`):

- `title: string` — required
- `description: string` — required (used for `<meta description>`, OG/Twitter tags, and the post list excerpt)
- `pubDate` — required, coerced to a `Date`
- `updatedDate` — optional, coerced to a `Date`
- `draft` — optional boolean, defaults to `false`. **`draft: true` silently excludes the post everywhere** — `getBlogPosts()` (`src/lib/blog.ts`) filters it out of the blog index, all three feeds, the sitemap, `llms.txt`, and adjacent-post navigation.

Posts are sorted newest-`pubDate`-first. Reading time, feed entries, and the post's OG image are generated automatically at build time from that one file — nothing else needs updating to publish a post.

**Editing home page sections:** `src/pages/index.astro` renders four `DesktopWindow` instances: About me (`intro.md`), Writing (four latest posts, rendered inline), Projects (`opensource.md` + `support.md`), Personal (`personal.md`). There is no `writing.md` section.

**Editing `/now`, `/work`, `/uses`, or `/colophon`:** edit the matching `.md` file in `src/sections/` directly; the page files are thin wrappers. `work.md` is the condensed CV, including skills, selected client work, education and email contact.

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

Browser regressions live in `e2e/desktop.spec.ts`: keyboard move/close/reopen and focus restoration, click movement, Escape dismissing action menus first, skip-link focus, desktop/footer clearance, plain-view persistence, mobile stacking/touch targets, reduced motion, dark colour scheme and no-JavaScript content. Axe scans cover desktop/plain home, blog index, a post and standalone pages at 320px/1280px in both light and dark colour schemes using WCAG A/AA tags through 2.2. Run `npm run test:e2e` after shell changes. Automated scans do not establish full compliance; manually check screen-reader announcements, keyboard-only navigation, zoom/reflow and touch too.

`astro:content` is a virtual Astro module that doesn't exist outside the Astro runtime. Tests that import from `src/lib/blog.ts` use `vi.hoisted` + `vi.mock` to intercept it. The alias in `vitest.config.ts` resolves it to `src/__mocks__/astro-content.ts` so Vite can find the module during test runs.

**Coverage:** `vitest.config.ts` configures `@vitest/coverage-v8` scoped to `src/lib/**/*.ts`, with lines/branches/functions/statements thresholds all set to 100. Vitest 4's v8 provider reports on every file matching `include` by default (a new file with no test shows up as 0% rather than being silently excluded), so no `all: true` flag is needed. Test files are already excluded from coverage by Vitest's own default (it appends the `test.include` glob to `coverage.exclude` automatically), so `vitest.config.ts` doesn't repeat that exclusion. `npm run test:coverage` runs it locally; CI runs it as part of the `ci` job's Node 22 leg only (Node 24 runs the plain `npm test` instead — coverage can't meaningfully differ between Node versions here, so instrumenting twice would just double the cost for no signal). Astro components, pages, and layouts are deliberately out of scope — they need the Astro/browser runtime to execute meaningfully, which is what manual browser verification and Lighthouse are for, not Vitest. Keep coverage at 100% by writing the missing test case, not by carving out an exclusion or reaching for a `/* v8 ignore */` comment — those should stay rare enough to need justifying on sight.

## Lefthook

Lefthook runs a pre-commit hook on the staged files: Prettier with `--write` and ESLint with `--fix`. Configuration is in `lefthook.yml`. Files the formatter or linter change are re-staged automatically. Unit tests run separately and in CI. `npm install` installs the hooks (the `prepare` script runs `lefthook install --force`, which works even with a global `core.hooksPath`).

## CI

The `e2e` job installs Chromium and runs `npm run test:e2e` on Node 22. Keep browser regressions and axe scans green as well as the lint/build/unit gates.

`.github/workflows/ci.yml` runs on every push and PR to `main`: `lint:check` (no autofix), `build` + `test` on Node 22 and 24 (Node 22 runs `test:coverage` instead of plain `test`), and an informational Lighthouse run (`continue-on-error`, report uploaded as an artifact). `test:coverage` fails the job if coverage in `src/lib` drops below 100% on any metric — see Tests. Pre-commit hooks cover lint and format locally, not unit tests, `astro check` type-checking or coverage. Run `npm run build` and `npm run test:coverage` locally before pushing if you've touched types or `src/lib`, or a failure will only surface in CI.

Dependabot (`.github/dependabot.yml`) groups each ecosystem's updates into one PR. Most npm and GitHub Actions dependencies check monthly (first Saturday); `astro` and `zod` are split into their own weekly-grouped PR instead.

## Deployment

The site is hosted on **Cloudflare Workers** (`@astrojs/cloudflare` adapter, migrated off Cloudflare Pages). `wrangler.jsonc` at the project root is the source of truth. Deployment **is** Git-integrated via Cloudflare Workers Builds: **a push to `main` automatically builds and deploys to production**, and a push to any other branch (including a PR branch) gets its own isolated preview deployment at a `<hash>-fieldnotes.timothybrits.workers.dev` URL, posted as a PR comment by the `cloudflare-workers-and-pages` bot. `npm run deploy` (build, then `wrangler deploy`) still works as a manual CLI alternative, but **merging a PR to `main` is itself a production deploy** — treat it with the same caution as running `wrangler deploy` directly, see Safety. Production domain: `timothybrits.co.za` (`site` in `astro.config.mjs`).

Astro's build produces `dist/client` (static assets) and `dist/server` (the Worker script). `wrangler.jsonc`'s `main` points at `@astrojs/cloudflare/entrypoints/server` and `assets.directory` at `./dist/client` — the adapter also writes its own `dist/server/wrangler.json` mirroring the root config with paths relativized to `dist/server`; that's a build artifact for the adapter's own tooling, not something to edit or deploy from directly.

**Bindings** (all declared in `wrangler.jsonc`, typed via `wrangler types` into `worker-configuration.d.ts`, accessed in server code via `import { env } from "cloudflare:workers"`):

- `DB` — a D1 database (`fieldnotes-guestbook`, provisioned in the `weur` region) backing the guestbook. Schema lives in `migrations/`; apply with `wrangler d1 migrations apply fieldnotes-guestbook --local` (dev) or `--remote` (production — production data, treat like a deploy, see Safety).
- `GUESTBOOK_RATE_LIMITER` — Cloudflare's native Rate Limiting binding, capping guestbook POSTs at 5 per client IP per 60-second window (the only supported period granularity is 10 or 60 seconds).
- `ASSETS` — the static assets binding serving everything under `dist/client`.
- `TURNSTILE_SECRET_KEY` — a Cloudflare Turnstile secret, used server-side to verify guestbook submissions aren't bots. Not in `wrangler.jsonc` (secrets never are): set locally in `.dev.vars` (gitignored), in production via `wrangler secret put TURNSTILE_SECRET_KEY`. The matching public site key is `PUBLIC_TURNSTILE_SITE_KEY`, a build-time Astro env var (`.env` / `.env.production`, both gitignored) rendered into the guestbook page's Turnstile widget.

Two adapter features are deliberately turned off in `astro.config.mjs` rather than left at their defaults: `session: false` (the site has no per-user state, so there's no reason to provision a KV namespace for Astro's Sessions API) and `imageService: "passthrough"` (the site doesn't use `astro:assets`' `<Image>`/`getImage()` — only its `Font` API — so there's no reason to provision a Cloudflare Images binding). Both would otherwise be auto-provisioned on deploy.

**Observability:** `wrangler.jsonc` sets `observability.enabled: true` (Workers Logs, and live tailing via `wrangler tail` once deployed). There is no Smart Placement: the guestbook makes one or two D1 queries per request, and Cloudflare reported too few invocations for it to ever take effect.

`public/_headers` is unchanged from the Pages days — Workers with static assets supports `_headers`/`_redirects` natively, same syntax. It sets security headers (a strict CSP, HSTS, frame/referrer/permissions policy) and cache rules for every response, plus long cache lifetimes for `/_astro/*`, `/og/*`, and static image types. **If you add a new external resource** — a script, font, image, or API call from a new origin — the CSP's `default-src 'self'` will silently block it in production even though it works fine in `npm run dev`. Update the matching `-src` directive in `public/_headers` at the same time.

## Safety

- **Never deploy to production without explicit permission from the user.** Always ask first and wait for confirmation. This covers `wrangler deploy`/`npm run deploy`, **merging a PR into `main`** (Cloudflare Workers Builds auto-deploys on every push there — confirm this is still true before assuming otherwise), and anything else that changes the live Worker or its production data — including `wrangler d1 migrations apply --remote` and other `--remote`-flagged wrangler commands against the production D1 database.

## Architecture

**How the home page is assembled:** four markdown components and recent posts render inside four windows within one `<main>`. `Layout.astro` owns the menu bar, launchers and footer. Other main-site routes retain their URLs and render in one reading window. `/1999` remains a separate experiment using `Layout1999.astro`.

**Blog:** posts live in `src/content/blog/`, loaded by `src/content.config.ts` with Astro's `glob()` loader. Shared helpers are in `src/lib/blog.ts`. Three build-time feeds (`/rss.xml`, `/atom.xml`, `/feed.json`) share `getFeedItems` from `src/lib/feed.ts`; XML escaping lives in `src/lib/xml.ts`. Post pages include a petrol reading-progress bar, code-copy/share controls and a ToC when `getTocHeadings` finds at least three h2/h3 headings. Progress and scrollspy initialise on `astro:page-load` with listener/observer cleanup.

**SEO/crawler endpoints:** `src/pages/robots.txt.ts` and `src/pages/llms.txt.ts` are dynamically generated at build time (not static files in `public/`) — `robots.txt` points to the sitemap, `llms.txt` lists every page and post as an AI-crawler-friendly Markdown index. Both pull from the same `src/lib/blog.ts` helpers as the rest of the site, so a new post appears in `llms.txt` automatically, and a `draft: true` post is excluded from it too.

**Design system:** restrained late-80s/90s desktop environment, not an OS simulation. Overlapping windows, striped title bars, left-hand square close boxes, centred bitmap-style titles, 2px ink borders and 7px hard shadows. Oat & Petrol has exactly four colours per scheme: light desktop #c5bfb1, paper #f5f1e8, ink #302e29, petrol #17635d; dark desktop #1d1c19, paper #292723, ink #ece6d8, petrol #7cc4b8. Both palette comments and values are in `tokens.css`; dark mode follows `prefers-color-scheme` only (screen media, `color-scheme: light dark`), with no manual toggle or stored preference. In dark mode the hard shadow uses `--shadow` (#0e0d0b) rather than light ink, and the desktop dot and title-bar stripe SVGs have dark variants in `desktop.css`. Use the tokens rather than hard-coded colours in main-site CSS so both schemes stay in sync. No gradients, glass, blur, fake boot screens, CRT effects or decorative animation. Links invert to ink background/paper text on hover. Petrol is reserved for small meaningful states, focus, selection and the logo. Light: ink/paper 12.03:1, petrol/paper 6.25:1, petrol/desktop 3.85:1, so do not use petrol for small desktop text. Dark: ink/paper 11.98:1, ink/desktop 13.69:1, petrol/paper 7.41:1, petrol/desktop 8.48:1.

**Styling:** six shared files in `src/styles/`: `tokens.css`, `base.css`, `typography.css`, `code.css`, `print.css`, `desktop.css`. Desktop styles are imported last and own shell geometry, plain view, mobile reflow and reduced-motion overrides. Compatibility tokens alias the four colours, not extra colours (`--shadow` is the one dark-mode exception). Page-level scoped styles use one `:global()` per selector. Print exposes all window content in normal flow without interactive chrome; shared print rules force black-on-white and append link URLs.

**View modes and lifecycle:** HTML defaults to `data-view="plain"` for a usable no-JavaScript document. `src/scripts/desktop.ts` initialises on `astro:page-load`, applies `?view=plain` / `?view=desktop` or the local `fieldnotes-view` preference, and aborts previous listeners/observers on navigation. Storage errors must not block reading. The visible menu-bar escape hatch switches the current route. Below 761px windows stack, movement is disabled and touch scrolling stays native. Positions reset on resize/navigation; a ResizeObserver sizes the home workspace around visible windows to keep them above the footer.

**Accessibility:** the main landmark must have real dimensions despite absolute-positioned windows. Use buttons/links and Lucide pictograms; hide decorative icons from assistive technology. Launchers expose `aria-controls`/`aria-expanded`. Closing announces the action and returns focus to the launcher. Title controls support arrow-key movement and Escape; directional buttons provide click alternatives. Escape dismisses an open actions menu before the window. Reopening brings content forward and into view. Preserve visible focus, at least 24px desktop targets (28px close/actions), 44px phone close targets, native touch scrolling, reduced motion and visible plain-view headings. Never trap focus or require desktop play to access content.

**Hiding an element from print:** add the `no-print` class directly to it. `print.css` defines the single rule (`.no-print { display: none !important; }` under `@media print`); every page/component that has interactive chrome not worth printing (nav, footer, share/copy buttons, the reading-progress bar, back-links, the post ToC) applies the class itself rather than `print.css` maintaining a list of every other file's internal class names. Add `no-print` to any new interactive UI the same way — `print.css` never needs to change for it.

**Fonts:** VT323 (`--font-sans`, regular) for display/window titles; IBM Plex Mono (`--font-mono`, regular/semibold) for body, lists, labels and code. Astro's `fontProviders.fontsource()` serves fonts locally. No more than two UI typefaces. Small labels use wide tracking; body/display text uses zero tracking. OG generation still loads Geist directly from `@fontsource/geist`; it is not a third browser font.

**Markdown plugins:** `remark-smartypants` and `rehype-external-links` share options from `src/lib/markdown-config.ts` between Astro and feeds. `computeReadingTime` in `src/lib/blog.ts` strips markdown syntax before counting words, keeping index/post estimates identical. Shiki generates `min-light`/`min-dark` tokens, but desktop CSS renders code in ink on paper to preserve the four-colour UI.

**Build pipeline:** Astro integrations run at build time — `@astrojs/sitemap` (sitemap generation) and `astro-pagefind` (full-text search index; search UI rendered in the blog index via `astro-pagefind/components/Search`, implemented as a genuine Web Component so it re-initializes correctly across view-transition navigations with no extra glue code). `@astrojs/rss` is used by `rss.xml.ts` for the RSS feed.

**OG images:** `/og/[slug].png.ts` uses `satori` and `sharp` at build time. Images carry Timothy Brits branding and the paper/charcoal/petrol palette, with flush-left Geist titles loaded from `@fontsource/geist`.

**Guestbook:** `/1999/guestbook` is part of the `/1999` retro easter-egg section, styled by `Layout1999.astro`. Its form and entry list are plain client-side `fetch` calls to `/api/guestbook` (`src/pages/api/guestbook.ts`, the site's only on-demand route — `export const prerender = false`). Validation (trim, length caps, reject-if-empty) is `normalizeGuestbookInput` in `src/lib/guestbook.ts`, shared so the API route doesn't duplicate it; D1 access is `src/lib/guestbook-database.ts` (`listGuestbookEntries`, `insertGuestbookEntry`), typed against a structural `GuestbookDatabase` interface rather than D1's own types so it can be unit-tested with a fake in `guestbook-database.test.ts` instead of a real binding. `POST` checks the `GUESTBOOK_RATE_LIMITER` binding, then verifies a Cloudflare Turnstile token (`verifyTurnstileToken` in `src/lib/turnstile.ts`, against the `TURNSTILE_SECRET_KEY` secret) before validating and inserting; `GET` lists entries newest-first (capped at `MAX_ENTRIES`). The Turnstile widget itself is rendered client-side in `guestbook.astro` against the public `PUBLIC_TURNSTILE_SITE_KEY` env var (baked in at build time, since this is otherwise a fully static page) — its hidden `cf-turnstile-response` input lives inside the `<form>`, so it's picked up by the existing `FormData` read alongside name/message. The three seed entries (trace / anonymous / mico) live in `migrations/0001_create_guestbook_entries.sql` with backdated `created_at` values rather than as markup in the page.

**Standalone pages:** `/now`, `/work`, `/uses`, and `/colophon` import content from matching markdown files in `src/sections/` and render in the shared reading window. Keep them reachable from desktop launchers and the plain-view menu, including on phones. Add new routes to `llms.txt` and the browser scan list; the sitemap and search index are generated automatically.

**Components:** `DesktopWindow.astro` renders windows/controls; `src/scripts/desktop.ts` owns interaction and view mode. `PostListItem.astro` and `TagList.astro` render blog rows/tags. `CommandPalette.astro`, `CarbonBadge.astro`, `EasterEggs.astro` remain in the repository but are not mounted by the main layout; do not accidentally restore them. `/1999` retains its separate existing features.

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

- `load` and `DOMContentLoaded` only fire on hard load. Use `astro:page-load` for initial load and subsequent navigation, as the desktop controller and blog scripts do.
- Non-persisted nodes are replaced on navigation, so their direct listeners can be reattached. Listeners on `window`/`document` and observers survive and need cleanup. The desktop controller and blog progress/scrollspy use AbortControllers; disconnect ResizeObservers and IntersectionObservers when aborting.

**A client-side navigation can trip the CSP if any page has an inline module script.** `ClientRouter`'s soft-navigation code injects a `<script type="module" src="data:application/javascript,"/>` synchronization barrier whenever the page being navigated to has any `<script type="module">` with no `src` attribute — the barrier itself has no `src` this site's CSP allows, so it gets blocked and logs a CSP violation on every such navigation. `astro.config.mjs` sets `vite.build.assetsInlineLimit` to a function that returns `false` for `.js` files specifically to prevent that: it forces every component's compiled script to its own external, immutably-cached `/_astro/*.js` file (`src="..."` rather than inlined) so the trigger condition never occurs, rather than relaxing `script-src` to allow `data:` — the latter would work too, but `data:` in `script-src` is a known bypass vector for any future markup-injection bug, and the correct fix is to stop tripping the barrier, not to widen the CSP to tolerate it. If a new component's client script ever needs its own escape hatch from this, check that setting first.

**Prerendering runs inside a `workerd` sandbox by default, not Node.** Since Astro 6 / `@astrojs/cloudflare` v13, prerendered (static) pages are built by actually executing the Worker inside a `workerd`/Miniflare sandbox to match production as closely as possible — not plain Node, even though the output is 100% static HTML. Any prerendered route that depends on a native addon (`sharp`) or other `workerd`-incompatible Node/npm code will fail the build with an unhelpful `No such module` or WASM-compile error, even though it worked fine before the adapter was added. `astro.config.mjs` sets `adapter: cloudflare({ prerenderEnvironment: "node" })` for exactly this reason — `/og/[slug].png.ts` uses `sharp`. On-demand routes (`prerender = false`, i.e. `/api/guestbook`) always run in `workerd` regardless of this setting, since that's the real production runtime for them.

## Engineering principles

- **Keep it boring and flat.** This is a personal static site with no class hierarchies, no dependency injection, and no plugin system — SOLID/OCP-style abstractions don't have anywhere to attach. Prefer a plain function in `src/lib/` over an interface or a class.
- **Don't duplicate logic across the Astro and feed pipelines.** `src/lib/markdown-config.ts`, `src/lib/blog.ts`, and `src/lib/feed.ts` exist specifically so `astro.config.mjs`, the blog pages, and the three feed endpoints stay in sync — add new shared logic there, not copied inline at each call site.
- **YAGNI over speculative flexibility.** Don't add config options, props, or abstraction layers for a second use case that doesn't exist yet — this site has one author, one design, and one deployment target.
- **TDD: new logic in `src/lib/` ships with a test in the same commit, written first.** Every existing file there (`blog.ts`, `feed.ts`, `xml.ts`) has a matching `*.test.ts` — keep that 1:1, write the failing test before the implementation, and lean on the existing `astro:content` mock rather than inventing a new one.

## Commit Messages

Use [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) for every commit: `<type>[optional scope][!]: <description>`. Use lowercase types such as `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci` and `chore`. Mark breaking changes with `!` or a `BREAKING CHANGE:` footer and explain the impact.

- Use `feat` for new features and `fix` for bug fixes. Other useful types are `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `style` and `chore`.
- Use lowercase types, an optional short scope such as `desktop` or `deps`, and a concise imperative description, for example `feat(desktop): add accessible reading windows` or `chore(deps): update compatible npm dependencies`.
- Separate an optional body and footers from the subject with a blank line. Explain why a change was needed rather than listing every edited file.
- Mark breaking changes with `!` before the colon or a `BREAKING CHANGE: <description>` footer; explain the impact. A visual redesign alone is not a breaking API change.
- Keep commits focused when practical. Do not rewrite published history just to adopt this convention.

## Code Style

- **No inline comments** — never use trailing `//` comments on the same line as code. JSDoc block comments (`/** */`) are fine where genuinely useful.
- **British English spelling** in site copy and UI labels (section markdown, blog posts, nav/meta text) — "colour", "optimise", "favourite" — matching the author's other projects.
- Prettier enforces: double quotes, semicolons, 80-char width. It also runs `prettier-plugin-organize-imports` (auto-sorts imports) and `prettier-plugin-packagejson` (formats `package.json`) as part of `npm run format`.
- ESLint uses flat config (`eslint.config.js`) with TypeScript, Astro (including `jsx-a11y-recommended` — accessibility lint rules apply to `.astro` templates), Unicorn, `@eslint/css`, and `@eslint/markdown`, plus `eslint-config-prettier` to defer all formatting decisions to Prettier. Three Unicorn rules are disabled repo-wide: `filename-case` (needed for `[slug].astro`-style bracket filenames and PascalCase components), `prevent-abbreviations`, and `text-encoding-identifier-case`.
- CSS lint requires new properties/selectors to be **Baseline "newly available"** (`css/use-baseline`) — a very recent CSS feature can get flagged even though it works in current browsers; `text-wrap` and `:selection` are explicitly allowlisted as exceptions.
- `.github/` and `.claude/` are excluded from linting.
