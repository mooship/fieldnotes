# Timothy Brits

My personal site and blog, set out as a quiet retro desktop. It's built with Astro, TypeScript 6 and plain CSS. Content sits in windows you can drag and focus, and a visible **Skip the OS** link switches to ordinary reading. There are tags, full-text search, three feeds and generated share images. The repository and the Cloudflare resources still use the old `fieldnotes` name.

## Running it

You need Node 24 or later and npm 11 or later. `packageManager` pins npm 11.19.1 for Corepack and Cloudflare Workers Builds.

```sh
git clone https://github.com/mooship/fieldnotes.git
cd fieldnotes
npm install
npm run dev
```

The dev server runs at http://localhost:4321.

## Scripts

| Script                  | What it does                                                        |
| ----------------------- | ------------------------------------------------------------------- |
| `npm run dev`           | Local dev server                                                    |
| `npm run build`         | Type check, then production build                                   |
| `npm run lint`          | Biome and ESLint with auto-fix (code, CSS, Markdown)                |
| `npm run lint:check`    | The same lint without auto-fix (what CI runs)                       |
| `npm run preview`       | Build, then run it with `wrangler dev` and real Cloudflare bindings |
| `npm run deploy`        | Build, then `wrangler deploy` to Cloudflare Workers                 |
| `npm run format`        | Biome format (not `.astro` files)                                   |
| `npm test`              | Vitest unit tests                                                   |
| `npm run test:coverage` | Check 100% coverage in `src/lib`                                    |
| `npm run test:e2e`      | Browser regressions and axe scans against the built Worker          |
| `npm run lighthouse`    | Lighthouse CI against the built site (blocking in CI)               |

## Layout of the repo

```text
src/
  pages/            Routes: home, /now, /work, /uses, /colophon, 404, feeds,
                    robots.txt, llms.txt, the blog and tags, OG images,
                    the /1999 experiment and its guestbook API
  sections/         Markdown for the home windows and the standalone pages
  content/blog/     Blog posts
  components/       DesktopWindow, Icon, PostListItem, TagList
  layouts/          Layout.astro (desktop and reading pages), Layout1999.astro
  scripts/          desktop.ts (windows, view preference, sizing), email.ts
  lib/              Blog, feed, XML, guestbook, email, Turnstile and easter-egg
                    helpers, each with a test file
  styles/           tokens, base, typography, code, print, desktop
  __mocks__/        Vitest stub for astro:content
public/             Favicons, _headers and other static files
e2e/                Playwright seed and desktop accessibility checks
```

## Editing content

1. Home windows come from `src/sections/`. About me is `intro.md`, Projects combines `opensource.md` and `support.md`, and Personal is `personal.md`. Writing lists the four latest posts. `src/pages/index.astro` maps sections to windows.
2. `/now`, `/work`, `/uses` and `/colophon` read the markdown file of the same name in `src/sections/`. The Work page is a short CV, not a second record of employment details.
3. Posts go in `src/content/blog/`. Frontmatter takes `title`, `description`, `pubDate`, `updatedDate`, `draft` and `tags` (an array). `draft: true` keeps a post out of the blog index, all three feeds, the sitemap and `llms.txt`.
4. Run `npm run lint`, `npm test` and `npm run build` before pushing.

### Styles

Colours and spacing are custom properties in `src/styles/tokens.css`; element rules live in `src/styles/base.css`. The shell is `src/layouts/Layout.astro`, window controls are `src/components/DesktopWindow.astro`, geometry is `src/styles/desktop.css` and behaviour is `src/scripts/desktop.ts`.

The palette is called Oat and Petrol and has four colours. Light: desktop `#c5bfb1`, paper `#f5f1e8`, ink `#302e29`, petrol `#17635d`. Dark follows the system `prefers-color-scheme` setting: desktop `#3a3731`, paper `#22201c`, ink `#ece6d8`, petrol `#7cc4b8`, with a `#0e0d0b` hard shadow. There's no manual toggle, and print is always black on white. Corners stay square, borders 2px, shadows hard and offset, and links invert on hover. No glass, gradients, blur or decorative animation.

Type is VT323 for display and IBM Plex Mono for body and code, served locally through Astro's font API (`fontProviders.fontsource()`), which injects the declarations at build time.

### Accessible views

`?view=plain` shows the same content in normal flow and `?view=desktop` brings the windows back. The menu-bar link switches the current route, and `fieldnotes-view` stores the choice locally. Without JavaScript the site defaults to plain. Below 761px the windows stack and touch scrolling stays native. Print includes all content without the chrome.

Focus a window's title bar and use the arrow keys to move it, or use the directional buttons in its actions menu. Escape on the title bar closes the actions menu if it's open, and otherwise closes the window. Escape inside the window body (the blog search field, for example) is left alone. Closing returns focus to the launcher, and reopening brings the window back. Focus brings a window forward without trapping the keyboard. Reduced motion removes transitions.

Ink on paper is 12.03:1 and petrol on paper is 6.25:1. Petrol on the desktop colour is 3.85:1, which is fine for focus outlines but not for small text. Desktop targets are at least 24px and phone close boxes 44px. Run the browser checks after changing focus, controls or layout.

## Stack

- Astro with static output, plus one on-demand API route for the guestbook
- TypeScript 7.1 beta, with `@astrojs/ts-content-mapper` so `tsc` type-checks `.astro` files
- Biome for formatting, linting and import sorting, plus ESLint for Baseline-only CSS and Markdown
- Vitest with happy-dom
- A Lefthook pre-commit hook that formats and lints staged files (`npm install` sets it up); unit tests run separately and in CI
- `@astrojs/sitemap` and `astro-pagefind` for the sitemap and search
- Share images drawn with `satori` and `sharp` in the site's own VT323 and IBM Plex Mono
- RSS, Atom and JSON feeds
- A guestbook at `/1999/guestbook`, stored in Cloudflare D1 and capped by Cloudflare's Rate Limiting binding
- Cloudflare Workers through `@astrojs/cloudflare`. `public/_headers` sets a strict CSP and cache rules for that host, so any new external script, font, image or API call needs an entry there too.

The build would run on most Astro hosts, but this repo is set up for Cloudflare Workers: `wrangler.jsonc` declares the D1 and Rate Limiting bindings the guestbook needs.

## Before a big push

```sh
npm run lint
npm test
npm run build
npm run test:e2e
```

The browser checks cover keyboard controls, main and skip-link focus, footer clearance, the plain-view preference, mobile reflow, reduced motion, content without JavaScript, and WCAG A and AA axe scans at phone and desktop widths in light and dark. They also run in CI with lint, builds and unit tests on Node 22 and 24. They don't prove full accessibility; screen-reader, zoom and touch checks still have to be done by hand.

Pushes to `main` deploy automatically through Cloudflare, so don't deploy or merge to `main` without explicit permission.

## Licence

[MIT](LICENSE)
