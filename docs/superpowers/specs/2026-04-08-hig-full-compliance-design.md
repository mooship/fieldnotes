# HIG Full Compliance Design

**Date:** 2026-04-08  
**Status:** Approved

## Overview

A full pass to align the Fieldnotes site with Apple's Human Interface Guidelines. Covers four layers: color token system, typography, spacing, and components. The goal is a site that feels natively Apple — not merely inspired by it.

Previous HIG work (PR #130) addressed touch targets and color contrast. This spec addresses the remaining gaps: semantic token naming, typography hierarchy, 8pt grid alignment, nav chrome, and per-component polish.

## Approach

Option A (Systematic HIG Translation): rebuild all four layers in a single coordinated pass so the token names, type scale, and component decisions are designed against each other rather than accumulated piecemeal.

---

## Layer 1: Color Token System

### Token renames

All `--color-*` tokens in `src/styles/global.css` are renamed to HIG semantic names. All `var(--color-*)` references across every `.astro` file are updated to match.

| Old name | New name |
|---|---|
| `--color-bg` | `--system-background` |
| `--color-text` | `--label` |
| `--color-text-secondary` | `--secondary-label` |
| `--color-heading` | removed — use `--label` directly |
| `--color-link` | `--link` |
| `--color-link-hover` | `--link-hover` |
| `--color-accent` | `--tint` |
| `--color-border` | `--separator` |

### New tokens

| Token | Light | Dark |
|---|---|---|
| `--secondary-system-background` | #f2f2f7 | #1c1c1e |
| `--tertiary-system-background` | #ffffff | #2c2c2e |

### Updated values

| Token | Light (old → new) | Dark (old → new) |
|---|---|---|
| `--system-background` | #f8f8f5 → **#ffffff** | #000000 (unchanged) |
| `--label` | #1d1d1f → **#000000** | #f5f5f7 (unchanged) |
| `--link` | #0066cc → **#007aff** | #2997ff → **#0a84ff** |
| `--link-hover` | #004499 → **#0056b3** | #64b5f6 → **#409cff** |
| `--tint` | #0066cc → **#007aff** | #2997ff → **#0a84ff** |
| `--separator` | #d2d2d7 → **#c6c6c8** | #424245 → **#38383a** |

### Unchanged

The six rainbow apple accent colors (`--color-apple-{green,yellow,orange,red,purple,blue}`) and all their `-text`, `-tint`, `-hover` variants are unchanged — they are decorative, not semantic.

### `prefers-contrast: more`

A new `@media (prefers-contrast: more)` block is added:

```css
@media (prefers-contrast: more) {
  :root {
    --secondary-label: #3a3a3c;
    --separator: #aeaeb2;
  }
  html[data-theme="dark"] {
    --secondary-label: #ebebf5;
    --separator: #636366;
  }
}
```

Section card border width increases to `3px` and tag border width increases to `2px` within this query.

---

## Layer 2: Typography

### Font stack

EB Garamond is removed entirely. The `--font-serif` variable is dropped. All `var(--font-serif)` references (global headings, blockquotes, blog post titles, intro paragraph, PostListItem post titles, related-posts links) are replaced with `var(--font-sans)`.

`astro.config.mjs`: remove the EB Garamond font entry. Geist Sans is also removed from the Astro font config — the web now uses the system font stack directly. Geist Mono stays for code.

`src/styles/global.css`: since the Astro font API no longer injects `--font-sans`, define it manually in the `:root` block:

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
```

This renders SF Pro on Apple devices, Segoe UI on Windows, the platform system font elsewhere. The `<Font cssVariable="--font-sans" preload />` tag in `Layout.astro` is removed at the same time.

### Type scale

All sizes are in `rem` at a `17px` body base (1.0625rem = 17px).

| Role | HIG style | Size | Weight |
|---|---|---|---|
| Blog post `h1` | Large Title | 2.125rem | 400 |
| Section/article `h2` | Title 2 | 1.375rem | 600 (500 in dark) |
| Article `h3` | Title 3 | 1.25rem | 500 |
| Intro paragraph | Title 3 | 1.25rem | 400 |
| Body | Body | 1.0625rem | 400 |
| Nav links | Subheadline | 0.9375rem | 500 |
| Post description | Subheadline | 0.9375rem | 400 |
| Post date / reading time | Caption 1 | 0.75rem | 400 |
| Tags | Caption 1 | 0.75rem | 500 |
| Footer links | Footnote | 0.8125rem | 400 |

### Removed styling

- `text-transform: uppercase` — removed from nav links, feed links, tags
- `letter-spacing` — removed from nav links, feed links, tags, post metadata
- `font-variant: small-caps` — removed from post dates and reading time
- `font-style: italic` on blockquote — kept (italic is a valid HIG text emphasis pattern)

---

## Layer 3: Spacing (8pt Grid)

HIG uses an 8pt grid. 1pt = 1px at 1× density. All spacing should be a multiple of 4px (half-grid acceptable for tight contexts) or 8px.

Values that need adjustment:

| Location | File | Old | New |
|---|---|---|---|
| Tag padding | `global.css` | `0.45rem 0.6rem` | `0.5rem 0.75rem` |
| `.post-tags` gap | `global.css` | `0.4rem` | `0.5rem` |
| `li` margin-bottom | `global.css` | `0.625rem` | `0.5rem` |
| Recent-posts row gap | `index.astro` | `0.1rem` | `0.25rem` |

Everything else is already on-grid.

---

## Layer 4: Components

### Navigation (`Layout.astro`)

- Remove `text-transform: uppercase` and `letter-spacing: 0.08em` from `nav a`
- Font size: `0.8rem` → `0.9375rem`
- Weight: stays `500`
- Active indicator: keep existing `text-decoration: underline` with `--color-apple-blue` — this is acceptable HIG pattern for web nav

### Tags (`global.css`)

- Remove `text-transform: uppercase` and `letter-spacing: 0.04em`
- Border-radius: `3px` → `6px`
- Padding updates to grid-aligned values (covered in spacing layer)

### Footer feed links (`Layout.astro`)

- Remove `text-transform: uppercase` and `letter-spacing: 0.06em`
- Font size: `0.85rem` → `0.8125rem`

### Post metadata (`PostListItem.astro`, `blog/[slug].astro`, `index.astro`)

- Remove `font-variant: small-caps` and `letter-spacing: 0.05em` from all date/time/reading-time elements
- Font size standardised to `0.75rem` (Caption 1)

### Section cards (`index.astro`)

- Replace `--section-tint` background with `--secondary-system-background` on `.section-colored`
- The colored 2px top border stays (HIG-appropriate for sectioned grouped content)
- Section heading uses `--section-color` (rainbow accent) as before

### Separator borders

- All `border: 1px solid var(--color-border)` updated to `var(--separator)` throughout

### Focus ring (`global.css`)

- `outline: 3px solid var(--color-accent)` → `outline: 2px solid var(--tint)`
- `outline-offset: 3px` → `outline-offset: 2px`

### Blockquote (`blog/[slug].astro`)

- `font-family: var(--font-serif)` → `var(--font-sans)`
- `font-style: italic` stays

### Article headings (`blog/[slug].astro`)

- `font-family: var(--font-serif)` → `var(--font-sans)` on all `article :global(h2)`, `article :global(h3)`

---

## Layer 5: OG Image Generator

File: `src/pages/og/[slug].png.ts`

Satori requires a bundled font — system fonts are unavailable. Replace EB Garamond with Geist Sans:

- Remove `@fontsource/eb-garamond` from `package.json`
- Add `@fontsource/geist` to `package.json`
- Update font load path from `eb-garamond-latin-400-normal.woff` to the Geist equivalent
- Change `fontFamily: "EB Garamond"` → `"Geist"`
- Update `backgroundColor: "#f8f8f5"` → `"#ffffff"`
- Update `color: "#1d1d1f"` → `"#000000"` on title element

---

## Files Affected

- `astro.config.mjs` — remove EB Garamond and Geist Sans font entries
- `package.json` — swap `@fontsource/eb-garamond` for `@fontsource/geist`
- `src/styles/global.css` — token renames, type scale, spacing, tag styles, focus ring
- `src/layouts/Layout.astro` — remove `<Font cssVariable="--font-serif">` and `<Font cssVariable="--font-sans">` preload tags; nav styles, footer styles, token name updates
- `src/pages/index.astro` — section card background, post metadata, token names
- `src/pages/blog/index.astro` — token names, pagefind theme vars
- `src/pages/blog/[slug].astro` — article typography, post header metadata, token names
- `src/pages/blog/tags/[tag].astro` — token names
- `src/pages/now.astro` — `--font-serif` → `--font-sans`, token names (`--color-heading`, `--color-text`, `--color-text-secondary`)
- `src/pages/uses.astro` — `--font-serif` → `--font-sans`, token names (`--color-heading`, `--color-text`)
- `src/pages/404.astro` — token names (`--color-heading`, `--color-text-secondary`)
- `src/components/PostListItem.astro` — post title font, metadata styles, token names
- `src/components/ThemeToggle.astro` — token names
- `src/components/EasterEggs.astro` — token names (`--color-bg`, `--color-border`, `--color-text`, `--color-text-secondary`)
- `src/pages/og/[slug].png.ts` — font swap, color values

## Out of Scope

- Content changes (no edits to `.md` files)
- Rainbow gradient stripe in header/footer (stays — decorative and on-brand)
- EasterEggs component (no visual changes needed)
- Feed XML endpoints
