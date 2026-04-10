# Fieldnotes

Personal link tree built with Astro + TypeScript + CSS. Fast, minimal, easy to tweak.

> Based on the excellent Astro Biolink Kit by [Leif](https://grains.leifjerami.com).

## Quick Start

Prerequisite: Bun 1.3+.

```sh
git clone <your-fork-url> fieldnotes
cd fieldnotes
bun install
bun run dev
```

Dev server runs at: http://localhost:4321

## Common Scripts

| Script            | Purpose                          |
| ----------------- | -------------------------------- |
| `bun run dev`     | Start local development server   |
| `bun run build`   | Type check then production build |
| `bun run lint`    | Lint and auto-fix all file types |
| `bun run preview` | Preview built site               |
| `bun run format`  | Prettier + import sorting        |
| `bun run test`        | Run Vitest unit tests            |

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
		blog.test.ts
		remark-reading-time.ts
		remark-reading-time.test.ts
		xml.ts           # XML character escaping (used by atom feed)
		xml.test.ts
	__mocks__/
		astro-content.ts # Vitest stub for astro:content virtual module
	styles/
		global.css       # Global styles / overrides
public/              # Static assets (images, favicons, etc.)
```

## Customising Your Links

1. Edit home page sections in `src/sections/intro.md`, `src/sections/personal.md`, `src/sections/writing.md`, `src/sections/opensource.md`, and `src/sections/support.md`.
2. Add blog posts in `src/content/blog/` (do not edit `src/sections/writing.md` for post content).
3. Run `bun run lint`, `bun run test`, and `bun run build` before pushing changes.

### Styling Tweaks

Small changes: adjust CSS variables or rules in `src/styles/global.css`.

Layout changes: edit `src/layouts/Layout.astro` (semantic HTML + scoped styles).

Fonts are self‑hosted (variable font packages) for performance & privacy.

## Tech Notes

- Astro 6.x
- TypeScript enabled (`tsconfig.json`)
- ESLint flat config for Astro, TS, CSS, and Markdown
- Vitest unit tests with happy-dom (run with `bun run test`)
- Lefthook pre-commit hook: runs `lint` + `format` in parallel on every commit
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
bun run lint
bun run test
bun run build
```

That's it — customise your content files, tweak styles, deploy anywhere Astro supports (Netlify, Vercel, Cloudflare, etc.).

Enjoy your lean, fast link hub.
