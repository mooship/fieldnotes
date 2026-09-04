# Fieldnotes

Personal site and blog built with Astro + TypeScript + CSS. Includes a blog with tags, full-text search, and OG image generation. Fast, minimal, easy to tweak.

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

| Script               | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start local development server           |
| `npm run build`      | Type check then production build         |
| `npm run lint`       | Lint and auto-fix all file types         |
| `npm run lint:check` | Same lint, no auto-fix — what CI runs    |
| `npm run preview`    | Preview built site                       |
| `npm run format`     | Prettier + import sorting                |
| `npm run test`       | Run Vitest unit tests                    |
| `npm run lighthouse` | Run Lighthouse CI against the built site |

## Structure (essentials)

```text
src/
  pages/
    index.astro          # Home page (imports 4 section .md files, blog list rendered inline)
    now.astro            # /now page
    uses.astro           # /uses page
    colophon.astro       # /colophon page
    404.astro
    robots.txt.ts
    llms.txt.ts
    rss.xml.ts
    atom.xml.ts
    feed.json.ts
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
    uses.md              # /uses page content
    colophon.md          # /colophon page content
  components/
    PostListItem.astro   # Single post row in blog listings
    CarbonBadge.astro    # Page carbon footprint badge
  content/
    blog/                # Blog posts (.md)
  layouts/
    Layout.astro         # Base layout wrapper
  lib/
    blog.ts              # Blog helpers (fetch, sort, slug, constants)
    blog.test.ts
    feed.ts              # Shared feed item builder (used by rss/atom/json endpoints)
    feed.test.ts
    markdown-config.ts   # Shared remark/rehype plugin options
    xml.ts               # XML character escaping (atom feed)
    xml.test.ts
  __mocks__/
    astro-content.ts     # Vitest stub for astro:content virtual module
  styles/
    tokens.css           # CSS custom properties
    base.css             # Resets and base element styles
    typography.css       # Type scale
    code.css             # Code block styles
    print.css            # @media print rules
public/                  # Static assets (images, favicons, etc.)
```

## Customising Content

1. Edit home page sections in `src/sections/intro.md`, `src/sections/personal.md`, `src/sections/opensource.md`, and `src/sections/support.md` — rendered in that order by `src/pages/index.astro`, with the blog listing rendered inline between the intro and open-source sections.
2. Edit `/now`, `/uses`, and `/colophon` content in `src/sections/now.md`, `src/sections/uses.md`, and `src/sections/colophon.md`.
3. Add blog posts in `src/content/blog/` — frontmatter supports `title`, `description`, `pubDate`, `updatedDate`, `draft`, and `tags` (array). `draft: true` excludes a post from the blog index, all three feeds, the sitemap, and `llms.txt`.
4. Run `npm run lint`, `npm run test`, and `npm run build` before pushing changes.

### Styling Tweaks

Small changes: adjust CSS variables in `src/styles/tokens.css` or element rules in `src/styles/base.css`.

Layout changes: edit `src/layouts/Layout.astro` (semantic HTML + scoped styles).

Fonts are loaded via Astro's font API (`fontProviders.fontsource()`) — declarations are injected automatically at build time.

## Tech Notes

- Astro (static output)
- TypeScript enabled (`tsconfig.json`)
- ESLint flat config for Astro, TS, CSS, and Markdown
- Vitest unit tests with happy-dom (`npm run test`)
- Lefthook pre-commit hook: runs `lint`, `format`, and `test` on every commit (run `npx lefthook install` after cloning to activate it)
- Fonts via `fontProviders.fontsource()` (Geist + Geist Mono)
- Prettier formatting + import sorting
- `@astrojs/sitemap` (sitemap) + `astro-pagefind` (full-text search) integrations
- OG image generation via `satori` + `sharp`
- RSS, Atom, and JSON feed endpoints
- Hosted on Cloudflare Pages — `public/_headers` sets a strict CSP and cache rules specific to that host; adding a new external resource (script, font, image, API call) needs a matching entry there too

## License

[MIT License](LICENSE)

Your personal content (links, descriptions) is yours — consider adding a note if you want to explicitly release it (e.g., CC0) or keep all-rights-reserved.

## Maintenance Checklist

Run before pushing major changes:

```sh
npm run lint
npm run test
npm run build
```

That's it — customise your content files, tweak styles, deploy. The static build output can run on most Astro-compatible hosts, but this repo is configured for Cloudflare Pages specifically (`public/_headers` sets Cloudflare-specific CSP and cache headers).

Enjoy your lean, fast link hub.
