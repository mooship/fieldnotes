# Ligaro

Personal link tree built with Astro + TypeScript + CSS. Fast, minimal, easy to tweak.

> Based on the excellent Astro Biolink Kit by [Leif](https://grains.leifjerami.com).

## Quick Start

Prerequisite: Node 22.21.1 and npm.

```sh
git clone <your-fork-url> ligaro
cd ligaro
npm install
npm run dev
```

Dev server runs at: http://localhost:4321

## Common Scripts

| Script             | Purpose                           |
| ------------------ | --------------------------------- |
| `npm run dev`      | Start local development server    |
| `npm run build`    | Type check then production build  |
| `npm run lint`     | Lint Astro, TS, CSS, and Markdown |
| `npm run lint:fix` | Auto-fix lint issues              |
| `npm run preview`  | Preview built site                |
| `npm run format`   | Prettier + import sorting         |

## Structure (essentials)

```text
src/
	pages/
		index.astro      # Home page (imports and renders sections)
		blog/
			index.astro    # Blog index
			[slug].astro   # Blog post page
	sections/
		intro.md         # Introduction section
		personal.md      # Personal links
		writing.md       # Writing intro section on home page
		opensource.md    # Open source section
		support.md       # Support section
	content/
		blog/            # Blog posts (.md)
	layouts/
		Layout.astro     # Base layout wrapper
	lib/
		blog.ts          # Blog helpers
		remark-reading-time.ts
	styles/
		global.css       # Global styles / overrides
public/              # Static assets (images, favicons, etc.)
```

## Customising Your Links

1. Edit home page sections in `src/sections/intro.md`, `src/sections/personal.md`, `src/sections/writing.md`, `src/sections/opensource.md`, and `src/sections/support.md`.
2. Add blog posts in `src/content/blog/` (do not edit `src/sections/writing.md` for post content).
3. Run `npm run lint` and `npm run build` before pushing changes.

### Styling Tweaks

Small changes: adjust CSS variables or rules in `src/styles/global.css`.

Layout changes: edit `src/layouts/Layout.astro` (semantic HTML + scoped styles).

Fonts are self‑hosted (variable font packages) for performance & privacy.

## Tech Notes

- Astro 6.x
- TypeScript enabled (`tsconfig.json`)
- ESLint flat config for Astro, TS, CSS, and Markdown
- Astro font provider setup via `fontProviders.fontsource()` in `astro.config.mjs`
- Experimental Rust compiler enabled (`experimental.rustCompiler: true`)
- Import sorting + Prettier formatting
- Sitemap integration (`@astrojs/sitemap`) and static output build

## Updating

Pull upstream improvements from the original template if desired:

```sh
git remote add upstream https://github.com/leifjerami/astro-biolink-kit.git
git fetch upstream
git merge upstream/main
```

Resolve any merge conflicts (usually README or minor style changes).

## Attribution

Original project: Astro Biolink Kit by [Leif](https://grains.leifjerami.com).

## License

[MIT License](LICENSE)

Your personal content (links, descriptions) is yours — consider adding a note if you want to explicitly release it (e.g., CC0) or keep all-rights-reserved.

## Maintenance Checklist

Run before pushing major changes:

```sh
npm run lint
npm run build
```

That's it — customise your content files, tweak styles, deploy anywhere Astro supports (Netlify, Vercel, Cloudflare, etc.).

Enjoy your lean, fast link hub.
