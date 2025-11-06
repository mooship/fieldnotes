# Ligaro

Personal link tree built with Astro + TypeScript + CSS. Fast, minimal, easy to tweak.

> Based on the excellent Astro Biolink Kit by [Leif](https://grains.leifjerami.com).

## 🚀 Quick Start

Prerequisite: Node 24.11.0 and npm.

```sh
git clone <your-fork-url> ligaro
cd ligaro
npm install
npm run dev
```

Dev server runs at: http://localhost:4321

## 🧪 Common Scripts

| Script            | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start local development server   |
| `npm run build`   | Type check then production build |
| `npm run preview` | Preview built site               |
| `npm run lint`    | ESLint (auto-fix enabled)        |
| `npm run format`  | Prettier + import sorting        |

## 🗂 Structure (essentials)

```text
src/
	pages/
		index.astro      # Landing page layout
		bio.md           # Link data (edit this for your links)
	layouts/
		Layout.astro     # Base layout wrapper
	styles/
		global.css       # Global styles / overrides
public/              # Static assets (images, favicons, etc.)
```

## ✏️ Customizing Your Links

1. Open `src/pages/bio.md`
2. Add or edit Markdown list items / sections (each becomes part of the rendered link tree)
3. Commit changes — no rebuild logic required beyond normal Astro refresh

### Styling Tweaks

Small changes: adjust CSS variables or rules in `src/styles/global.css`.

Layout changes: edit `src/layouts/Layout.astro` (semantic HTML + scoped styles).

Fonts are self‑hosted (variable font packages) for performance & privacy.

## 🛠 Tech Notes

- Astro 5.x
- TypeScript enabled (`tsconfig.json`)
- Import sorting + Prettier formatting
- PurgeCSS + inlining for lean production builds

## 🔄 Updating

Pull upstream improvements from the original template if desired:

```sh
git remote add upstream https://github.com/leifjerami/astro-biolink-kit.git
git fetch upstream
git merge upstream/main
```

Resolve any merge conflicts (usually README or minor style changes).

## 🙌 Attribution

Original project: Astro Biolink Kit by [Leif](https://grains.leifjerami.com).

## 📄 License

This project is licensed under the **MIT License** — see [`LICENSE`](./LICENSE).

Your personal content (links, descriptions) is yours — consider adding a note if you want to explicitly release it (e.g., CC0) or keep all-rights-reserved.

## ✅ Maintenance Checklist

Run before pushing major changes:

```sh
npm run lint
npm run build
```

That’s it — customize `bio.md`, tweak styles, deploy anywhere Astro supports (Netlify, Vercel, Cloudflare, etc.).

Enjoy your lean, fast link hub.
