# Copilot Instructions — Ligaro

Personal link tree site: single-page, static, built with Astro.

## Commands

```bash
npm run dev        # start dev server (localhost:4321)
npm run build      # astro check (type checking) → astro build — this is the verification step
npm run format     # prettier (astro, import sorting, package.json)
```

There are no tests or linting scripts to run. **`npm run build` is how you verify changes** — it runs TypeScript/Astro checks before building.

## Architecture

- **Single page at `/`** — [src/pages/index.astro](../src/pages/index.astro) imports `.md` files from `src/sections/` as Astro content components and renders them sequentially inside `<main>`.
- **Static output only** — no server runtime, no API routes, no SSR. Deployed to **Cloudflare Pages**.
- **Astro 6** with experimental Rust compiler enabled.

### Key files

| File                                                                | Purpose                                                                             |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [src/pages/index.astro](../src/pages/index.astro)                   | Page assembly, section layout styles (`:global()` selectors), seasonal color script |
| [src/layouts/Layout.astro](../src/layouts/Layout.astro)             | `<head>` setup, SEO (OG/Twitter/JSON-LD), font preloading, footer                   |
| [src/styles/global.css](../src/styles/global.css)                   | CSS custom properties, light/dark theme, typography, link animations                |
| [src/components/Particles.astro](../src/components/Particles.astro) | CSS-only floating particle animation (decorative)                                   |
| [src/sections/\*.md](../src/sections/)                              | Content sections — each wraps content in `<div class="section-{name}">`             |
| [public/\_headers](../public/_headers)                              | Cloudflare Pages security/cache headers (CSP, X-Frame-Options)                      |

### Content sections

Each markdown file in `src/sections/` is imported via `import { Content as XContent } from "../sections/x.md"` — they are **not routes**, just content components. They use raw HTML inside markdown (Remix Icon `<i class="ri-*">` tags, `<div>` wrappers with section classes).

Section render order in index.astro: intro → personal → opensource → writing → support.

## Conventions

### Styling

- **CSS custom properties** define the color system: `--color-bg`, `--color-text`, `--color-link`, etc.
- **Light/dark** handled via `@media (prefers-color-scheme: dark)` in global.css — no class toggling.
- **Seasonal theming** — a `<script>` in index.astro adjusts `--color-link` and `--color-link-hover` based on the current month (summer=green, autumn=brown, winter=blue, spring=default).
- **Page-level styles** use `:global()` selectors to reach into markdown-rendered elements.
- Each section `.md` wraps content in `<div class="section-{name}">` so pseudo-elements (wavy separators, left borders) can be applied via CSS.

### Fonts

- **Lora Variable** (headings) and **DM Sans Variable** (body) via Astro's font API (`fontProviders.fontsource()`).
- CSS variables: `--font-lora`, `--font-dm-sans`. Consumed in global.css on `body` and `h1, h2`.
- Preloaded via `<Font cssVariable="..." preload />` in Layout.astro.

### Icons

- **Remix Icon** (`remixicon` npm package), CSS imported in Layout.astro.
- Used inline in section markdown as `<i class="ri-github-line"></i>`.

### SEO

- Layout.astro accepts props: `title`, `description`, `image`, `canonical`, `robots`, `type`.
- Generates Open Graph tags, Twitter card tags, and JSON-LD schema (WebSite/Article).
- Sitemap generated via `@astrojs/sitemap` integration.

## When editing

- **Adding a link**: Edit the relevant `src/sections/*.md` file. Follow the existing pattern: `- [<i class="ri-*"></i><span>Label</span>](url)`.
- **Adding a section**: Create a new `.md` in `src/sections/`, wrap content in `<div class="section-{name}">`, import it in index.astro, and add matching styles.
- **Changing colors**: Edit CSS custom properties in `src/styles/global.css` (both light and dark blocks).
- **Always run `npm run build`** after changes to verify.

## Tech stack

- Astro 6 (static, Rust compiler)
- TypeScript (base config, `astro check` for validation)
- Prettier (astro + import sorting + package.json plugins)
- Node ≥22.21.1
- Cloudflare Pages (hosting, `_headers` for security)
