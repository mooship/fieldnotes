# Carbon Score Optimization

**Date:** 2026-05-13  
**Goal:** Reduce page weight and JS payload to improve the Website Carbon score.

## Background

The carbon score is driven by bytes transferred per page view. The site is already on Cloudflare Pages (green hosting), so the main lever is page weight. Two of the biggest contributors are JavaScript (Easter eggs, view transitions) and font variants (Fraunces loaded in 6 weight/style combinations).

## Changes

### 1. Delete EasterEggs component

Delete `src/components/EasterEggs.astro` entirely. This removes ~270 lines of JS: keyboard sequence listeners, multi-touch handlers, toast show/hide logic, and the DOM element it renders.

In `src/layouts/Layout.astro`:
- Remove `import EasterEggs from "../components/EasterEggs.astro"`
- Remove `<EasterEggs />` from the body

### 2. Remove ClientRouter (view transitions)

In `src/layouts/Layout.astro`:
- Remove `import { ClientRouter } from "astro:transitions"`
- Remove `<ClientRouter />` from the `<head>`

Strip all `transition:name` attributes (they are no-ops without ClientRouter and add noise):
- `src/layouts/Layout.astro`: `transition:name="wordmark"` on the wordmark `<a>`
- `src/components/PostListItem.astro`: `transition:name={...}` on the post title `<a>`
- `src/pages/blog/[slug].astro`: `transition:name={...}` on the `<h1>`

### 3. Fix event listeners

`astro:page-load` is dispatched by `ClientRouter` after every navigation — it will not fire once ClientRouter is removed. Two files depend on it:

- `src/components/CarbonBadge.astro`: change `document.addEventListener("astro:page-load", initBadge)` → `document.addEventListener("DOMContentLoaded", initBadge)`
- `src/pages/blog/[slug].astro`: same swap for its initialization listener

### 4. Font weight reduction

In `astro.config.mjs`, change the Fraunces font entry:

```js
// Before
weights: [400, 500, 700],
styles: ["normal", "italic"],

// After
weights: [400, 700],
styles: ["normal", "italic"],
```

This drops two font files: Fraunces 500 normal and Fraunces 500 italic.

Update all serif `font-weight: 500` declarations to `font-weight: 400`:

| File | Selector |
|---|---|
| `src/styles/base.css` | `h2`, `h3`, `h3, h4` |
| `src/styles/typography.css` | `main h2` |
| `src/layouts/Layout.astro` | `.wordmark-title` |
| `src/components/PostListItem.astro` | `.post-title` |

`styles: ["normal", "italic"]` is retained — 400 italic is required for `em`/`i` in body text.

## What is not changed

- `styles/tags.css` uses `font-weight: 500` on `.tag`, but `.tag` uses `--font-sans` (system font, no download)
- Pagefind is out of scope for this change
- Geist Mono font is out of scope for this change

## Verification

- `npm run build` must pass (astro check + build)
- `npm run test` must pass
- Manual check: home page, a blog post, and the blog index should render correctly with no JS errors
- CarbonBadge should initialize and display on page load
