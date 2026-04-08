# HIG Full Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Fieldnotes site with Apple's Human Interface Guidelines by rebuilding the CSS token system to HIG semantics, replacing all typography with the system font stack and HIG type scale, snapping spacing to the 8pt grid, and refining component styles site-wide.

**Architecture:** All changes are in CSS/Astro styling — no structural changes to routes, data, or business logic. Changes flow outward from `global.css` (token definitions) to page/component files (token consumers). Font packages are swapped first because the EB Garamond import in the OG image generator will fail to compile if the package is removed without simultaneously updating the import path.

**Tech Stack:** Astro 5, CSS custom properties, Satori + Sharp (OG images), `@fontsource/geist`

---

## File Map

| File | Changes |
|---|---|
| `package.json` | Remove `@fontsource/eb-garamond`, add `@fontsource/geist` |
| `astro.config.mjs` | Remove EB Garamond and Geist Sans font entries |
| `src/pages/og/[slug].png.ts` | Swap font to Geist, update bg/text colors |
| `src/styles/global.css` | Rebuild token block; update all CSS rules; add prefers-contrast block |
| `src/layouts/Layout.astro` | Remove Font preload tags; update nav/footer styles; token renames |
| `src/pages/blog/[slug].astro` | Article typography; post header metadata; token renames |
| `src/pages/index.astro` | Section card background; post metadata styles; token renames |
| `src/components/PostListItem.astro` | Post title font; metadata styles; token renames |
| `src/pages/blog/index.astro` | Token renames in pagefind CSS vars |
| `src/pages/blog/tags/[tag].astro` | Token renames |
| `src/pages/now.astro` | `--font-serif` removal; token renames |
| `src/pages/uses.astro` | `--font-serif` removal; token renames |
| `src/pages/404.astro` | Token renames |
| `src/components/EasterEggs.astro` | Token renames |
| `src/components/ThemeToggle.astro` | Token renames |

---

## Task 1: Swap Font Packages and Update OG Image Generator

These three files must change together — removing the `@fontsource/eb-garamond` package without updating the import path in `og/[slug].png.ts` breaks the build.

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`
- Modify: `src/pages/og/[slug].png.ts`

- [ ] **Step 1: Update package.json**

In `package.json` dependencies, replace:
```json
"@fontsource/eb-garamond": "^5.2.7",
```
with:
```json
"@fontsource/geist": "^5.0.0",
```

- [ ] **Step 2: Remove EB Garamond and Geist Sans from astro.config.mjs**

In `astro.config.mjs`, replace the entire `fonts` array:
```js
fonts: [
  {
    provider: fontProviders.bunny(),
    name: "EB Garamond",
    cssVariable: "--font-serif",
  },
  {
    provider: fontProviders.bunny(),
    name: "Geist Mono",
    cssVariable: "--font-mono",
  },
  {
    provider: fontProviders.bunny(),
    name: "Geist Sans",
    cssVariable: "--font-sans",
  },
],
```
with (Geist Mono only):
```js
fonts: [
  {
    provider: fontProviders.bunny(),
    name: "Geist Mono",
    cssVariable: "--font-mono",
  },
],
```

- [ ] **Step 3: Update the OG image generator**

Replace the entire `src/pages/og/[slug].png.ts` with:
```ts
import type { APIRoute, GetStaticPaths } from "astro";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { getBlogPosts, getPostSlug } from "../../lib/blog";

const require = createRequire(import.meta.url);

const RAINBOW_GRADIENT =
  "linear-gradient(to right, #61bb46, #fdb827, #f5821f, #e03a3e, #963d97, #009ddc)";

let fontData: Buffer | undefined;

async function loadFont(): Promise<Buffer> {
  if (fontData) return fontData;
  const fontPath =
    require.resolve("@fontsource/geist/files/geist-latin-400-normal.woff");
  fontData = await readFile(fontPath);
  return fontData;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    params: { slug: getPostSlug(post.id) },
    props: { title: post.data.title },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title } = props as { title: string };
  const font = await loadFont();

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: "#ffffff",
          padding: "60px 80px",
          fontFamily: "Geist",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                width: "100%",
                height: "6px",
                position: "absolute",
                top: "0",
                left: "0",
                background: RAINBOW_GRADIENT,
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: "56px",
                lineHeight: 1.15,
                color: "#000000",
                letterSpacing: "-0.01em",
                maxWidth: "90%",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: "24px",
                color: "#6e6e73",
                marginTop: "32px",
              },
              children: "timothybrits.co.za",
            },
          },
          {
            type: "div",
            props: {
              style: {
                width: "100%",
                height: "6px",
                position: "absolute",
                bottom: "0",
                left: "0",
                background: RAINBOW_GRADIENT,
              },
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Geist",
          data: font,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
```

- [ ] **Step 4: Install packages**

```bash
pnpm install
```

Expected: new lockfile entry for `@fontsource/geist`, `@fontsource/eb-garamond` removed.

- [ ] **Step 5: Verify build passes**

```bash
pnpm run build
```

Expected: exits 0. `astro check` passes. OG image routes are generated.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml astro.config.mjs src/pages/og/[slug].png.ts
git commit -m "feat: swap EB Garamond for Geist in OG images, remove web font entries"
```

---

## Task 2: Rebuild CSS Token Block in global.css

Replace the `:root` and `html[data-theme="dark"]` blocks with HIG-semantic names and updated values. Also add `--font-sans` (now defined manually since Astro no longer injects it).

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Replace the :root block**

Replace the entire `:root { ... }` block (lines 1–44) with:

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
    sans-serif;
  --rainbow-gradient: linear-gradient(
    to right,
    var(--color-apple-green),
    var(--color-apple-yellow),
    var(--color-apple-orange),
    var(--color-apple-red),
    var(--color-apple-purple),
    var(--color-apple-blue),
    var(--color-apple-green),
    var(--color-apple-yellow)
  );
  --system-background: #ffffff;
  --secondary-system-background: #f2f2f7;
  --tertiary-system-background: #ffffff;
  --label: #000000;
  --secondary-label: #6e6e73;
  --link: #007aff;
  --link-hover: #0056b3;
  --tint: #007aff;
  --separator: #c6c6c8;
  --color-apple-green: #61bb46;
  --color-apple-yellow: #fdb827;
  --color-apple-orange: #f5821f;
  --color-apple-red: #e03a3e;
  --color-apple-purple: #963d97;
  --color-apple-blue: #009ddc;
  --color-apple-green-text: #3d8c27;
  --color-apple-yellow-text: #7a5900;
  --color-apple-orange-text: #a14e0b;
  --color-apple-red-text: #b52e31;
  --color-apple-purple-text: #7a2e7b;
  --color-apple-blue-text: #006d9e;
  --color-apple-green-tint: rgba(97, 187, 70, 0.07);
  --color-apple-yellow-tint: rgba(253, 184, 39, 0.07);
  --color-apple-orange-tint: rgba(245, 130, 31, 0.07);
  --color-apple-red-tint: rgba(224, 58, 62, 0.07);
  --color-apple-purple-tint: rgba(150, 61, 151, 0.07);
  --color-apple-green-hover: #2e7a1c;
  --color-apple-yellow-hover: #6b4d00;
  --color-apple-orange-hover: #8a4308;
  --color-apple-red-hover: #9a2528;
  --color-apple-purple-hover: #662468;
  --color-apple-blue-hover: #005e84;
}
```

- [ ] **Step 2: Replace the html[data-theme="dark"] block**

Replace the entire `html[data-theme="dark"] { ... }` block (lines 46–78) with:

```css
html[data-theme="dark"] {
  --system-background: #000000;
  --secondary-system-background: #1c1c1e;
  --tertiary-system-background: #2c2c2e;
  --label: #f5f5f7;
  --secondary-label: #86868b;
  --link: #0a84ff;
  --link-hover: #409cff;
  --tint: #0a84ff;
  --separator: #38383a;
  --color-apple-green: #7ecc66;
  --color-apple-yellow: #fdc94f;
  --color-apple-orange: #f79a4a;
  --color-apple-red: #e86366;
  --color-apple-purple: #b06ab1;
  --color-apple-blue: #4db8e8;
  --color-apple-green-text: #7ecc66;
  --color-apple-yellow-text: #fdc94f;
  --color-apple-orange-text: #f79a4a;
  --color-apple-red-text: #e86366;
  --color-apple-purple-text: #b06ab1;
  --color-apple-blue-text: #4db8e8;
  --color-apple-green-tint: rgba(126, 204, 102, 0.1);
  --color-apple-yellow-tint: rgba(253, 201, 79, 0.1);
  --color-apple-orange-tint: rgba(247, 154, 74, 0.1);
  --color-apple-red-tint: rgba(232, 99, 102, 0.1);
  --color-apple-purple-tint: rgba(176, 106, 177, 0.1);
  --color-apple-green-hover: #a0e088;
  --color-apple-yellow-hover: #fedd88;
  --color-apple-orange-hover: #f9b878;
  --color-apple-red-hover: #f09092;
  --color-apple-purple-hover: #ca90cb;
  --color-apple-blue-hover: #80d0f0;
}
```

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

Expected: exits 0. Some pages will temporarily use undefined old token names (CSS falls back silently — the build still passes).

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: rebuild CSS token block to HIG semantic names"
```

---

## Task 3: Update CSS Base Styles in global.css

Update all CSS rules below the token blocks to use the new token names and apply HIG typography/component changes.

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Update html and body base styles**

Replace:
```css
html {
  background: var(--color-bg);
}

body {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 1.0625rem;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings:
    "kern" 1,
    "liga" 1,
    "onum" 1;
  background: var(--color-bg);
  color: var(--color-text);
  max-width: 640px;
  margin: 0 auto;
  padding: calc(40px + env(safe-area-inset-top))
    calc(20px + env(safe-area-inset-right))
    calc(40px + env(safe-area-inset-bottom))
    calc(20px + env(safe-area-inset-left));
  transition: background-color 0.3s ease;
}
```
with:
```css
html {
  background: var(--system-background);
}

body {
  font-family: var(--font-sans);
  font-size: 1.0625rem;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings:
    "kern" 1,
    "liga" 1,
    "onum" 1;
  background: var(--system-background);
  color: var(--label);
  max-width: 640px;
  margin: 0 auto;
  padding: calc(40px + env(safe-area-inset-top))
    calc(20px + env(safe-area-inset-right))
    calc(40px + env(safe-area-inset-bottom))
    calc(20px + env(safe-area-inset-left));
  transition: background-color 0.3s ease;
}
```

- [ ] **Step 2: Update h1 and h2 base styles**

Replace:
```css
h1 {
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
  font-weight: 400;
  color: var(--color-heading);
  text-wrap: balance;
  letter-spacing: -0.01em;
  line-height: 1.15;
}

h2 {
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
  font-weight: 400;
  color: var(--color-heading);
  text-wrap: balance;
  letter-spacing: 0;
  line-height: 1.15;
}
```
with:
```css
h1 {
  font-weight: 400;
  color: var(--label);
  text-wrap: balance;
  letter-spacing: -0.01em;
  line-height: 1.15;
}

h2 {
  font-weight: 400;
  color: var(--label);
  text-wrap: balance;
  letter-spacing: 0;
  line-height: 1.15;
}
```

- [ ] **Step 3: Update focus ring, link, and li styles**

Replace:
```css
a:focus-visible,
button:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 6px;
}

a {
  color: var(--color-link);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}
```
with:
```css
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--tint);
  outline-offset: 2px;
  border-radius: 6px;
}

a {
  color: var(--link);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--link-hover);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}
```

Replace:
```css
li {
  margin-bottom: 0.625rem;
  color: var(--color-text-secondary);
  text-wrap: pretty;
}
```
with:
```css
li {
  margin-bottom: 0.5rem;
  color: var(--secondary-label);
  text-wrap: pretty;
}
```

- [ ] **Step 4: Update .tag styles**

Replace:
```css
.tag {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--tag-color, var(--color-apple-blue-text));
  border: 1px solid var(--tag-color, var(--color-apple-blue-text));
  border-radius: 3px;
  padding: 0.45rem 0.6rem;
  text-decoration: none;
}

.tag:hover,
.tag:focus-visible {
  background: var(--tag-color, var(--color-apple-blue-text));
  color: var(--color-bg);
  text-decoration: none;
}
```
with:
```css
.tag {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--tag-color, var(--color-apple-blue-text));
  border: 1px solid var(--tag-color, var(--color-apple-blue-text));
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
}

.tag:hover,
.tag:focus-visible {
  background: var(--tag-color, var(--color-apple-blue-text));
  color: var(--system-background);
  text-decoration: none;
}
```

Update `.post-tags` gap:
```css
.post-tags {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
}
```
(change from `gap: 0.4rem`)

- [ ] **Step 5: Add prefers-contrast: more block**

Append after the existing `@media (prefers-reduced-motion: reduce)` block:

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

  .tag {
    border-width: 2px;
  }
}
```

- [ ] **Step 6: Verify build and tests pass**

```bash
pnpm test && pnpm run build
```

Expected: all Vitest tests pass, `astro check` passes, build exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: update global.css base styles to HIG type scale and tokens"
```

---

## Task 4: Update Layout.astro

Remove the Font preload tags for the removed fonts; update nav and footer styles; rename all token references.

**Files:**
- Modify: `src/layouts/Layout.astro`

- [ ] **Step 1: Remove Font preload tags and update theme-color meta**

In the `<head>`, replace:
```astro
<Font cssVariable="--font-serif" preload />
<Font cssVariable="--font-mono" />
<Font cssVariable="--font-sans" preload />
```
with:
```astro
<Font cssVariable="--font-mono" />
```

Update the light theme-color meta:
```html
<meta
  name="theme-color"
  content="#ffffff"
  media="(prefers-color-scheme: light)"
/>
```
(was `#f8f8f5`)

- [ ] **Step 2: Update nav styles**

In the `<style>` block, replace:
```css
header a:first-child {
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
  font-weight: 400;
  font-size: 1.2rem;
  color: var(--color-heading);
  letter-spacing: -0.01em;
}
```
with:
```css
header a:first-child {
  font-weight: 400;
  font-size: 1.2rem;
  color: var(--label);
  letter-spacing: -0.01em;
}
```

Replace:
```css
nav a {
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.75rem 0.5rem;
  color: var(--color-text-secondary);
  text-decoration: none;
}

nav a:hover {
  color: var(--color-text);
  text-decoration: none;
}

nav a[aria-current="page"],
nav a[aria-current="page"]:hover {
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--color-apple-blue);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}
```
with:
```css
nav a {
  font-weight: 500;
  font-size: 0.9375rem;
  padding: 0.75rem 0.5rem;
  color: var(--secondary-label);
  text-decoration: none;
}

nav a:hover {
  color: var(--label);
  text-decoration: none;
}

nav a[aria-current="page"],
nav a[aria-current="page"]:hover {
  color: var(--label);
  text-decoration: underline;
  text-decoration-color: var(--color-apple-blue);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}
```

- [ ] **Step 3: Update footer styles**

Replace:
```css
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: none;
  background-image: var(--rainbow-gradient);
  background-size: 200% 4px;
  background-repeat: no-repeat;
  background-position: 0% top;
  animation: rainbow-shimmer 8s ease-in-out infinite alternate;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}
```
with:
```css
footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: none;
  background-image: var(--rainbow-gradient);
  background-size: 200% 4px;
  background-repeat: no-repeat;
  background-position: 0% top;
  animation: rainbow-shimmer 8s ease-in-out infinite alternate;
  font-size: 0.8125rem;
  color: var(--secondary-label);
}
```

Replace:
```css
.feed-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```
with:
```css
.feed-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
```

Replace:
```css
footer a {
  color: var(--color-link);
}

footer a:hover {
  color: var(--color-link-hover);
}
```
with:
```css
footer a {
  color: var(--link);
}

footer a:hover {
  color: var(--link-hover);
}
```

- [ ] **Step 4: Update skip-link styles**

Replace:
```css
.skip-link:focus-visible {
  position: fixed;
  top: 1rem;
  left: 1rem;
  width: auto;
  height: auto;
  overflow: visible;
  padding: 0.5rem 1rem;
  background: var(--color-bg);
  color: var(--color-link);
  border: 2px solid var(--color-link);
  border-radius: 4px;
  font-size: 0.9rem;
  z-index: 9999;
  text-decoration: none;
}
```
with:
```css
.skip-link:focus-visible {
  position: fixed;
  top: 1rem;
  left: 1rem;
  width: auto;
  height: auto;
  overflow: visible;
  padding: 0.5rem 1rem;
  background: var(--system-background);
  color: var(--link);
  border: 2px solid var(--link);
  border-radius: 4px;
  font-size: 0.9rem;
  z-index: 9999;
  text-decoration: none;
}
```

- [ ] **Step 5: Verify build passes**

```bash
pnpm run build
```

Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat: update Layout.astro nav/footer to HIG styles"
```

---

## Task 5: Update blog/[slug].astro

Update article typography (h1 size, h2/h3 font and size, blockquote font), post header metadata (remove small-caps and letter-spacing), code block backgrounds, and all token names.

**Files:**
- Modify: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Update h1 size and color**

In the `<style>` block, replace:
```css
h1 {
  color: var(--color-heading);
  font-weight: 400;
  font-size: 2.75rem;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.01em;
  line-height: 1.08;
}
```
with:
```css
h1 {
  color: var(--label);
  font-weight: 400;
  font-size: 2.125rem;
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.01em;
  line-height: 1.08;
}
```

- [ ] **Step 2: Update post header metadata styles**

Replace:
```css
time,
.reading-time {
  display: block;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
  font-variant: small-caps;
  text-transform: none;
}
```
with:
```css
time,
.reading-time {
  display: block;
  font-size: 0.75rem;
  color: var(--secondary-label);
}
```

- [ ] **Step 3: Update article heading typography**

Replace:
```css
article :global(h2),
article :global(h3),
article :global(h4) {
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
  color: var(--color-heading);
  font-weight: 600;
  margin: 2.5rem 0 0.75rem 0;
  text-wrap: balance;
  letter-spacing: 0;
  line-height: 1.15;
}

article :global(h2) {
  font-size: 1.5rem;
}

article :global(h3) {
  font-size: 1.2rem;
  font-weight: 500;
}
```
with:
```css
article :global(h2),
article :global(h3),
article :global(h4) {
  color: var(--label);
  font-weight: 600;
  margin: 2.5rem 0 0.75rem 0;
  text-wrap: balance;
  letter-spacing: 0;
  line-height: 1.15;
}

article :global(h2) {
  font-size: 1.375rem;
}

article :global(h3) {
  font-size: 1.25rem;
  font-weight: 500;
}
```

- [ ] **Step 4: Update blockquote**

Replace:
```css
article :global(blockquote) {
  border-left: 3px solid var(--color-apple-blue);
  margin: 1.5rem 0;
  padding: 0.25rem 0 0.25rem 1.25rem;
  color: var(--color-text-secondary);
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
  font-size: 1.05rem;
  font-style: italic;
}
```
with:
```css
article :global(blockquote) {
  border-left: 3px solid var(--color-apple-blue);
  margin: 1.5rem 0;
  padding: 0.25rem 0 0.25rem 1.25rem;
  color: var(--secondary-label);
  font-size: 1.05rem;
  font-style: italic;
}
```

- [ ] **Step 5: Update code backgrounds**

Replace:
```css
article :global(code) {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-size: 0.85em;
  background: var(--color-border);
  padding: 0.2em 0.4em;
  border-radius: 6px;
}

article :global(pre) {
  font-family: var(--font-mono), ui-monospace, monospace;
  background: var(--color-border);
  padding: 1.25rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-size: 0.9rem;
  line-height: 1.6;
}
```
with:
```css
article :global(code) {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-size: 0.85em;
  background: var(--secondary-system-background);
  padding: 0.2em 0.4em;
  border-radius: 6px;
}

article :global(pre) {
  font-family: var(--font-mono), ui-monospace, monospace;
  background: var(--secondary-system-background);
  padding: 1.25rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-size: 0.9rem;
  line-height: 1.6;
}
```

- [ ] **Step 6: Update copy button styles**

Replace:
```css
article :global(.copy-btn) {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  cursor: pointer;
  opacity: 0.6;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
}
```
with:
```css
article :global(.copy-btn) {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--system-background);
  border: 1px solid var(--separator);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--secondary-label);
  cursor: pointer;
  opacity: 0.6;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
}
```

Replace:
```css
article :global(.copy-btn:focus-visible) {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```
with:
```css
article :global(.copy-btn:focus-visible) {
  outline: 2px solid var(--tint);
  outline-offset: 2px;
}
```

Replace:
```css
article :global(.copy-btn:hover) {
  color: var(--color-text);
}
```
with:
```css
article :global(.copy-btn:hover) {
  color: var(--label);
}
```

- [ ] **Step 7: Update series box, related posts, post nav token names**

Replace `var(--color-border)` → `var(--separator)` in:
- `.series-box { border: 1px solid var(--color-border); ... }`
- `.related-posts { border-top: 1px solid var(--color-border); }`
- `.post-nav { border-top: 1px solid var(--color-border); }`
- `header { border-bottom: 1px solid var(--color-border); }`

Replace `var(--color-text-secondary)` → `var(--secondary-label)` in:
- `.series-label { color: var(--color-text-secondary); }`
- `.series-box li { color: var(--color-text-secondary); }`
- `.related-posts h2 { color: var(--color-text-secondary); }`

Replace `var(--color-text)` → `var(--label)` in:
- `.series-box li.current { color: var(--color-text); }`

Replace `var(--font-serif)` → `var(--font-sans)` in:
- `.related-posts a { font-family: var(--font-serif), ...; }`

The complete updated selectors after these replacements:
```css
header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--separator);
}

.series-box {
  border: 1px solid var(--separator);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  background: var(--color-apple-green-tint);
}

.series-label {
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--secondary-label);
  margin: 0 0 0.5rem 0;
}

.series-box li {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: var(--secondary-label);
}

.series-box li.current {
  color: var(--label);
  font-weight: 600;
}

.related-posts {
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--separator);
}

.related-posts h2 {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--secondary-label);
  margin: 0 0 0.75rem 0;
}

.related-posts a {
  font-family: var(--font-sans), system-ui, sans-serif;
  font-size: 0.95rem;
}

.post-nav {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--separator);
}
```

- [ ] **Step 8: Verify build passes**

```bash
pnpm run build
```

Expected: exits 0.

- [ ] **Step 9: Commit**

```bash
git add src/pages/blog/[slug].astro
git commit -m "feat: update blog post page to HIG typography and tokens"
```

---

## Task 6: Update index.astro

Replace the section card tint background with `--secondary-system-background`, update post metadata styles, and rename token references.

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Update section card background**

In the `<style>` block, replace:
```css
:global(.section-colored) {
  margin-top: 2rem;
  padding: 1.5rem 1rem 1.25rem 1rem;
  margin-left: -1rem;
  margin-right: -1rem;
  border-top: 2px solid var(--section-border, var(--section-color));
  background-color: var(--section-tint);
}
```
with:
```css
:global(.section-colored) {
  margin-top: 2rem;
  padding: 1.5rem 1rem 1.25rem 1rem;
  margin-left: -1rem;
  margin-right: -1rem;
  border-top: 2px solid var(--section-border, var(--section-color));
  background-color: var(--secondary-system-background);
}
```

- [ ] **Step 2: Update heading and link hover token names**

Replace:
```css
:global(.section-colored) :global(h2) {
  color: var(--section-color);
}

:global(.section-colored) :global(a:hover),
:global(.section-colored) :global(a:focus-visible) {
  color: var(--section-hover);
}

main :global(h2) {
  color: var(--color-heading);
  margin: 0 0 1rem 0;
  font-weight: 600;
  font-size: 1.35rem;
  letter-spacing: -0.01em;
}
```
with:
```css
:global(.section-colored) :global(h2) {
  color: var(--section-color);
}

:global(.section-colored) :global(a:hover),
:global(.section-colored) :global(a:focus-visible) {
  color: var(--section-hover);
}

main :global(h2) {
  color: var(--label);
  margin: 0 0 1rem 0;
  font-weight: 600;
  font-size: 1.375rem;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 3: Update secondary text and post date styles**

Replace:
```css
main :global(h2 + p) {
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  margin-top: -0.5rem;
}
```
with:
```css
main :global(h2 + p) {
  color: var(--secondary-label);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  margin-top: -0.5rem;
}
```

Replace:
```css
main :global(.project-desc) {
  margin: 0.15rem 0 0 0;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
```
with:
```css
main :global(.project-desc) {
  margin: 0.15rem 0 0 0;
  font-size: 0.82rem;
  color: var(--secondary-label);
  line-height: 1.5;
}
```

Replace:
```css
.post-date {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  margin-left: 0;
  letter-spacing: 0.05em;
  font-variant: small-caps;
}
```
with:
```css
.post-date {
  font-size: 0.75rem;
  color: var(--secondary-label);
  margin-left: 0;
}
```

Replace:
```css
.all-posts {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
}
```
with:
```css
.all-posts {
  font-size: 0.8125rem;
  color: var(--secondary-label);
}
```

- [ ] **Step 4: Update intro paragraph style**

Replace:
```css
:global(main > p:first-child) {
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
  color: var(--color-text);
  margin-bottom: 2.5rem;
  font-size: 1.35rem;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
```
with:
```css
:global(main > p:first-child) {
  color: var(--label);
  margin-bottom: 2.5rem;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
```

- [ ] **Step 5: Update recent-posts li gap**

Replace:
```css
.recent-posts li {
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
```
with:
```css
.recent-posts li {
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
```

- [ ] **Step 6: Update main link font size**

Replace:
```css
main :global(a) {
  font-size: 0.95rem;
}
```
with:
```css
main :global(a) {
  font-size: 0.9375rem;
}
```

- [ ] **Step 7: Add prefers-contrast: more for section card border**

Append to the `<style>` block in `src/pages/index.astro`:

```css
@media (prefers-contrast: more) {
  :global(.section-colored) {
    border-top-width: 3px;
  }
}
```

- [ ] **Step 8: Verify build passes**

```bash
pnpm run build
```

Expected: exits 0.

- [ ] **Step 9: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: update homepage to HIG section cards and token names"
```

---

## Task 7: Update PostListItem.astro

Remove the serif font from post titles, strip small-caps from metadata, and rename token references.

**Files:**
- Modify: `src/components/PostListItem.astro`

- [ ] **Step 1: Update post title and metadata styles**

Replace the entire `<style>` block content with:
```css
li {
  margin-bottom: 1.5rem;
}

.post-title {
  font-size: 1.05rem;
  font-weight: 500;
}

.post-meta {
  font-size: 0.75rem;
  color: var(--secondary-label);
  margin: 0.25rem 0 0 0;
}

.post-desc {
  margin: 0.25rem 0 0 0;
  font-size: 0.9375rem;
  color: var(--secondary-label);
  line-height: 1.47;
}
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/PostListItem.astro
git commit -m "feat: update PostListItem to HIG typography and tokens"
```

---

## Task 8: Update blog/index.astro and blog/tags/[tag].astro

Token renames only — these files have no typography changes beyond what is inherited.

**Files:**
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/blog/tags/[tag].astro`

- [ ] **Step 1: Update blog/index.astro pagefind variables**

In the `<style>` block, replace:
```css
.search-wrapper :global(.pagefind-ui) {
  --pagefind-ui-scale: 0.85;
  --pagefind-ui-primary: var(--color-link);
  --pagefind-ui-text: var(--color-text);
  --pagefind-ui-background: var(--color-bg);
  --pagefind-ui-border: var(--color-border);
  --pagefind-ui-border-width: 1px;
  --pagefind-ui-border-radius: 6px;
  --pagefind-ui-font: var(--font-sans), system-ui, sans-serif;
}
```
with:
```css
.search-wrapper :global(.pagefind-ui) {
  --pagefind-ui-scale: 0.85;
  --pagefind-ui-primary: var(--link);
  --pagefind-ui-text: var(--label);
  --pagefind-ui-background: var(--system-background);
  --pagefind-ui-border: var(--separator);
  --pagefind-ui-border-width: 1px;
  --pagefind-ui-border-radius: 6px;
  --pagefind-ui-font: var(--font-sans), system-ui, sans-serif;
}
```

Also update the `h1` in blog/index.astro:
```css
h1 {
  text-align: left;
  color: var(--label);
  margin: 0 0 1.5rem 0;
  font-weight: 400;
  font-size: 3rem;
  letter-spacing: -0.01em;
  line-height: 1.08;
}
```
(was `color: var(--color-heading)`)

- [ ] **Step 2: Update blog/tags/[tag].astro**

Find and replace `var(--color-heading)` with `var(--label)` in the `<style>` block of `src/pages/blog/tags/[tag].astro`.

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog/index.astro src/pages/blog/tags/[tag].astro
git commit -m "feat: update blog index and tags pages to HIG tokens"
```

---

## Task 9: Update now.astro and uses.astro

Replace `--font-serif` with `--font-sans` and rename all old token references.

**Files:**
- Modify: `src/pages/now.astro`
- Modify: `src/pages/uses.astro`

- [ ] **Step 1: Update now.astro**

In the `<style>` block of `src/pages/now.astro`:

Replace every `var(--font-serif), Georgia, "Times New Roman", serif` with `var(--font-sans)`.

Replace all token names:
- `var(--color-heading)` → `var(--label)`
- `var(--color-text)` → `var(--label)`
- `var(--color-text-secondary)` → `var(--secondary-label)`

- [ ] **Step 2: Update uses.astro**

In the `<style>` block of `src/pages/uses.astro`:

Replace every `var(--font-serif), Georgia, "Times New Roman", serif` with `var(--font-sans)`.

Replace all token names:
- `var(--color-heading)` → `var(--label)`
- `var(--color-text)` → `var(--label)`

- [ ] **Step 3: Verify build passes**

```bash
pnpm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/pages/now.astro src/pages/uses.astro
git commit -m "feat: update now and uses pages to HIG tokens"
```

---

## Task 10: Update 404.astro, EasterEggs.astro, ThemeToggle.astro

Token renames only in these three files.

**Files:**
- Modify: `src/pages/404.astro`
- Modify: `src/components/EasterEggs.astro`
- Modify: `src/components/ThemeToggle.astro`

- [ ] **Step 1: Update 404.astro**

In the `<style>` block of `src/pages/404.astro`:
- `var(--color-heading)` → `var(--label)`
- `var(--color-text-secondary)` → `var(--secondary-label)`

- [ ] **Step 2: Update EasterEggs.astro**

In the `<style>` block of `src/components/EasterEggs.astro`:
- `var(--color-bg)` → `var(--system-background)`
- `var(--color-border)` → `var(--separator)`
- `var(--color-text)` → `var(--label)`
- `var(--color-text-secondary)` → `var(--secondary-label)`

- [ ] **Step 3: Update ThemeToggle.astro**

In the `<style>` block of `src/components/ThemeToggle.astro`:
- `var(--color-text-secondary)` → `var(--secondary-label)`
- `var(--color-text)` → `var(--label)`

- [ ] **Step 4: Verify build and tests pass**

```bash
pnpm test && pnpm run build
```

Expected: all Vitest tests pass, build exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/pages/404.astro src/components/EasterEggs.astro src/components/ThemeToggle.astro
git commit -m "feat: update 404, EasterEggs, ThemeToggle to HIG tokens"
```

---

## Task 11: Final Verification

Confirm the full build is clean, tests pass, and no old token names remain.

**Files:** none (read-only verification)

- [ ] **Step 1: Run tests and build**

```bash
pnpm test && pnpm run build
```

Expected: all Vitest tests pass, `astro check` passes, build exits 0.

- [ ] **Step 2: Confirm no old token names remain**

```bash
grep -r "color-bg\|color-text\|color-heading\|color-link\|color-border\|color-accent\|font-serif" src/
```

Expected: no output (zero matches).

- [ ] **Step 3: Confirm no EB Garamond references remain**

```bash
grep -r "eb-garamond\|EB Garamond\|Garamond" src/ astro.config.mjs
```

Expected: no output.

- [ ] **Step 4: Run linter**

```bash
pnpm run lint
```

Expected: exits 0 with no errors.
