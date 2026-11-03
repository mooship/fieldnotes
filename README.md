# Timothy Brits

Personal site and blog presented as a restrained retro desktop, built with Astro, TypeScript 6 and CSS. Real content lives in draggable, focusable windows, with a visible **Skip the OS** link to conventional reading. Includes tags, full-text search, feeds and generated share images. Repository and Cloudflare resources retain the `fieldnotes` name.

## Quick Start

Prerequisite: Node 22+ and npm.

```sh
git clone <your-fork-url> fieldnotes
cd fieldnotes
npm install
npm run dev
```

Dev server runs at: http://localhost:4321

## Common Scripts

| Script                  | Purpose                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `npm run dev`           | Start local development server                                            |
| `npm run build`         | Type check then production build                                          |
| `npm run lint`          | Lint and auto-fix all file types                                          |
| `npm run lint:check`    | Same lint, no auto-fix — what CI runs                                     |
| `npm run preview`       | Build, then run it locally with `wrangler dev` (real Cloudflare bindings) |
| `npm run deploy`        | Build, then `wrangler deploy` to Cloudflare Workers                       |
| `npm run format`        | Prettier + import sorting                                                 |
| `npm test`              | Run Vitest unit tests                                                     |
| `npm run test:coverage` | Verify 100% coverage in `src/lib`                                         |
| `npm run test:e2e`      | Browser regressions and axe scans against the built Worker                |
| `npm run lighthouse`    | Run Lighthouse CI against the built site                                  |

## Structure (essentials)

```text
src/
  pages/
    index.astro          # Four windows, section markdown and recent posts
    now.astro            # /now page
    work.astro           # Professional experience, skills and education
    uses.astro           # /uses page
    colophon.astro       # /colophon page
    404.astro
    robots.txt.ts
    llms.txt.ts
    rss.xml.ts
    atom.xml.ts
    feed.json.ts
    api/
      guestbook.ts        # On-demand route (D1 + Rate Limiting binding) for the /1999 guestbook
    blog/
      index.astro        # Blog index (includes pagefind search)
      [slug].astro       # Blog post page
      tags/
        index.astro      # All tags
        [tag].astro      # Posts for a tag
    og/
      [slug].png.ts      # OG image generation (satori + sharp)
  sections/
    intro.md             # Home page: introduction
    personal.md          # Home page: personal links
    opensource.md        # Home page: open source
    support.md           # Home page: support
    now.md               # /now page content
    work.md              # Condensed CV for /work
    uses.md              # /uses page content
    colophon.md          # /colophon page content
  components/
    PostListItem.astro   # Single post row in blog listings
    DesktopWindow.astro # Semantic window and close/move controls
    TagList.astro        # Blog tags
  content/
    blog/                # Blog posts (.md)
  layouts/
    Layout.astro         # Desktop shell and reading pages
    Layout1999.astro     # Separate /1999 experiment
  scripts/
    desktop.ts           # Interaction, view preference and workspace sizing
  lib/
    blog.ts              # Blog helpers (fetch, sort, slug, constants)
    blog.test.ts
    feed.ts              # Shared feed item builder (used by rss/atom/json endpoints)
    feed.test.ts
    markdown-config.ts   # Shared remark/rehype plugin options
    xml.ts               # XML character escaping (atom feed)
    xml.test.ts
    guestbook.ts          # Guestbook input validation (normalizeGuestbookInput)
    guestbook.test.ts
    guestbook-database.ts        # D1 queries for the guestbook (structurally typed, testable with a fake)
    guestbook-database.test.ts
  __mocks__/
    astro-content.ts     # Vitest stub for astro:content virtual module
  styles/
    tokens.css           # CSS custom properties
    base.css             # Resets and base element styles
    typography.css       # Type scale
    code.css             # Code block styles
    print.css            # @media print rules
    desktop.css          # Shell, windows, plain view and phone reflow
public/                  # Static assets (images, favicons, etc.)
e2e/                     # Playwright seed and desktop accessibility/UX regressions
```

## Customising Content

1. Edit home sections in `src/sections/`: About me uses `intro.md`, Projects combines `opensource.md` and `support.md`, Personal uses `personal.md`. Writing lists four latest posts from the collection. `src/pages/index.astro` owns the mapping.
2. Edit `/now`, `/work`, `/uses`, and `/colophon` content in their matching markdown files in `src/sections/`. The Work page is a condensed CV, not a separate source of employment details to keep in sync.
3. Add blog posts in `src/content/blog/` — frontmatter supports `title`, `description`, `pubDate`, `updatedDate`, `draft`, and `tags` (array). `draft: true` excludes a post from the blog index, all three feeds, the sitemap, and `llms.txt`.
4. Run `npm run lint`, `npm test`, and `npm run build` before pushing changes.

### Styling Tweaks

Small changes: adjust CSS variables in `src/styles/tokens.css` or element rules in `src/styles/base.css`.

Layout changes: shell in `src/layouts/Layout.astro`, reusable controls in `src/components/DesktopWindow.astro`, geometry in `src/styles/desktop.css`, interaction in `src/scripts/desktop.ts`.

**Oat & Petrol** has four colours, declared with a one-line comment in `tokens.css`: desktop `#c5bfb1`, surface `#f5f1e8`, ink `#302e29`, accent `#17635d`. Keep square corners, 2px borders, 7px hard shadows and inverted hover links. No dark-mode palette, glass, gradients, blur or decorative animation.

### Accessible Views

`?view=plain` shows the same content in normal flow; `?view=desktop` restores windows. The menu-bar link switches the current route; `fieldnotes-view` stores the preference locally. No JavaScript defaults to plain. Below 761px, windows stack and touch scrolling stays native. Print includes all content without chrome.

Focus a title and use arrow keys to move, or use the actions menu's directional buttons. Escape dismisses that menu first, then closes the window. Closing returns focus to the launcher; reopening reveals the window. Focus brings windows forward without trapping the keyboard. Reduced motion removes transitions.

Ink/surface contrast is 12.03:1; petrol/surface is 6.25:1. Petrol/desktop is 3.85:1: suitable for focus outlines, not small text. Desktop targets must be at least 24px; phone close targets are 44px. Run browser checks after changing focus, controls or layout.

Fonts are loaded via Astro's font API (`fontProviders.fontsource()`) — declarations are injected automatically at build time.

## Tech Notes

- Astro (static output, plus one on-demand API route for the guestbook)
- TypeScript 6 with `astro check` retained for TypeScript and Astro templates
- ESLint flat config for Astro, TS, CSS, and Markdown
- Vitest unit tests with happy-dom (`npm test`)
- Lefthook pre-commit hook: formats and lints the staged files (`npm install` installs it); unit tests run separately and in CI
- Locally served fonts via `fontProviders.fontsource()` (VT323 display + IBM Plex Mono body/code)
- Prettier formatting + import sorting
- `@astrojs/sitemap` (sitemap) + `astro-pagefind` (full-text search) integrations
- OG image generation via `satori` + `sharp` (Geist remains a build-time font; palette and branding match the redesign)
- RSS, Atom, and JSON feed endpoints
- Guestbook (`/1999/guestbook`) backed by Cloudflare D1, with Cloudflare's native Rate Limiting binding capping submissions
- Hosted on Cloudflare Workers (`@astrojs/cloudflare` adapter) — `public/_headers` sets a strict CSP and cache rules specific to that host; adding a new external resource (script, font, image, API call) needs a matching entry there too

## License

[MIT License](LICENSE)

Your personal content (links, descriptions) is yours — consider adding a note if you want to explicitly release it (e.g., CC0) or keep all-rights-reserved.

## Maintenance Checklist

Run before pushing major changes:

```sh
npm run lint
npm test
npm run build
npm run test:e2e
```

That's it — customise your content files, tweak styles, deploy. The build output can run on most Astro-compatible hosts, but this repo is configured for Cloudflare Workers specifically (`wrangler.jsonc` declares the D1 and Rate Limiting bindings the guestbook needs; `public/_headers` sets Cloudflare-specific CSP and cache headers).

Browser checks cover keyboard controls, main/skip-link focus, footer clearance, plain preference, mobile reflow, reduced motion, no-JavaScript content and WCAG A/AA axe scans at phone/desktop widths, including `/work`. They run in CI alongside lint, builds and utility tests on Node 22/24. They do not establish full accessibility compliance; manual screen-reader, zoom and touch checks remain necessary. Deploying or merging to `main` requires explicit permission: Cloudflare automatically deploys pushes there.
