# Carbon Score Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce page weight by removing the EasterEggs component, dropping Astro view transitions, and trimming Fraunces from 6 font variants to 4.

**Architecture:** All changes are deletions or targeted edits — no new abstractions. EasterEggs is deleted outright. ClientRouter and all `transition:name` attributes are stripped from Layout, PostListItem, and the blog post page. Two `astro:page-load` listeners that depended on ClientRouter are swapped to `DOMContentLoaded`. Font config drops weight 500; all serif CSS rules using `font-weight: 500` are updated to `400`.

**Tech Stack:** Astro 5, Fontsource (via Astro font API), Vitest, Lefthook (pre-commit: lint + format)

**Spec:** `docs/superpowers/specs/2026-05-13-carbon-score-optimization-design.md`

---

## File Map

| Action | File |
|---|---|
| Delete | `src/components/EasterEggs.astro` |
| Modify | `src/layouts/Layout.astro` |
| Modify | `src/components/CarbonBadge.astro` |
| Modify | `src/components/PostListItem.astro` |
| Modify | `src/pages/blog/[slug].astro` |
| Modify | `src/styles/base.css` |
| Modify | `src/styles/typography.css` |
| Modify | `astro.config.mjs` |

---

## Task 1: Remove EasterEggs

**Files:**
- Delete: `src/components/EasterEggs.astro`
- Modify: `src/layouts/Layout.astro`

Note: there are no unit tests for component removal — verification is a clean build.

- [ ] **Step 1: Remove EasterEggs import and usage from Layout.astro**

In `src/layouts/Layout.astro`, remove these two lines (they appear in the frontmatter block and the body respectively):

```diff
-import EasterEggs from "../components/EasterEggs.astro";
```

```diff
-    <EasterEggs />
```

The `<EasterEggs />` element sits between `<slot />` and `<footer>` in the body.

- [ ] **Step 2: Delete the EasterEggs component file**

```bash
rm src/components/EasterEggs.astro
```

- [ ] **Step 3: Verify the build passes**

```bash
npm run build
```

Expected: exits 0 with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro
git rm src/components/EasterEggs.astro
git commit -m "Remove EasterEggs component"
```

---

## Task 2: Remove ClientRouter and transition:name attributes

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/PostListItem.astro`
- Modify: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Remove ClientRouter from Layout.astro**

Remove the import:
```diff
-import { ClientRouter } from "astro:transitions";
```

Remove the element in `<head>`:
```diff
-    <ClientRouter />
```

Remove the `transition:name` attribute from the wordmark link (line ~125). The link should become:
```astro
<a href="/" class="wordmark">
```

- [ ] **Step 2: Remove transition:name from PostListItem.astro**

In `src/components/PostListItem.astro`, the post title link (line ~26) should become:
```astro
<a
  class="post-title"
  href={`/blog/${slug}`}
>{post.data.title}</a>
```

- [ ] **Step 3: Remove transition:name from blog/[slug].astro**

In `src/pages/blog/[slug].astro`, line 53 should become:
```astro
<h1>{post.data.title}</h1>
```

- [ ] **Step 4: Verify the build passes**

```bash
npm run build
```

Expected: exits 0 with no type errors or warnings about orphaned transition names.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Layout.astro src/components/PostListItem.astro src/pages/blog/[slug].astro
git commit -m "Remove ClientRouter and transition:name attributes"
```

---

## Task 3: Fix astro:page-load event listeners

**Files:**
- Modify: `src/components/CarbonBadge.astro`
- Modify: `src/pages/blog/[slug].astro`

`astro:page-load` is dispatched by `ClientRouter` — now that it's gone, these listeners never fire. Both need to switch to the standard `DOMContentLoaded` event.

- [ ] **Step 1: Fix CarbonBadge.astro**

In `src/components/CarbonBadge.astro`, the last line of the `<script>` block (line 70):

```diff
-  document.addEventListener("astro:page-load", initBadge);
+  document.addEventListener("DOMContentLoaded", initBadge);
```

- [ ] **Step 2: Fix blog/[slug].astro**

In `src/pages/blog/[slug].astro`, lines 242–245:

```diff
-  document.addEventListener("astro:page-load", () => {
+  document.addEventListener("DOMContentLoaded", () => {
     initCopyButtons();
     initShareButton();
   });
```

- [ ] **Step 3: Run tests and build**

```bash
npm run test && npm run build
```

Expected: all Vitest tests pass, build exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/CarbonBadge.astro src/pages/blog/[slug].astro
git commit -m "Replace astro:page-load with DOMContentLoaded"
```

---

## Task 4: Trim Fraunces font weights

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/styles/base.css`
- Modify: `src/styles/typography.css`
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/PostListItem.astro`

Dropping weight 500 from Fraunces removes two font files (500 normal + 500 italic) from the payload. All serif rules that declare `font-weight: 500` move to `400`. The sans-font rules in `tags.css` also use `font-weight: 500` but apply to `--font-sans` (system font, no download) — leave those alone.

- [ ] **Step 1: Drop weight 500 from Fraunces config**

In `astro.config.mjs`, find the Fraunces font entry and change:

```diff
-      weights: [400, 500, 700],
+      weights: [400, 700],
```

`styles: ["normal", "italic"]` stays unchanged.

- [ ] **Step 2: Update base.css**

In `src/styles/base.css`, change `font-weight` on the two serif heading rules:

```diff
 h2 {
   font-family: var(--font-serif);
-  font-weight: 500;
+  font-weight: 400;
```

```diff
 h3,
 h4 {
   font-family: var(--font-serif);
-  font-weight: 500;
+  font-weight: 400;
```

- [ ] **Step 3: Update typography.css**

In `src/styles/typography.css`, change the `main h2` rule:

```diff
 main h2 {
   font-family: var(--font-serif);
-  font-weight: 500;
+  font-weight: 400;
```

- [ ] **Step 4: Update Layout.astro**

In `src/layouts/Layout.astro`, inside the `<style>` block, change `.wordmark-title`:

```diff
 .wordmark-title {
   font-family: var(--font-serif);
   font-style: italic;
-  font-weight: 500;
+  font-weight: 400;
```

- [ ] **Step 5: Update PostListItem.astro**

In `src/components/PostListItem.astro`, inside the `<style>` block, change `.post-title`:

```diff
 .post-title {
   font-size: 1.05rem;
-  font-weight: 500;
+  font-weight: 400;
```

- [ ] **Step 6: Run tests and build**

```bash
npm run test && npm run build
```

Expected: all Vitest tests pass, build exits 0.

- [ ] **Step 7: Commit**

```bash
git add astro.config.mjs src/styles/base.css src/styles/typography.css src/layouts/Layout.astro src/components/PostListItem.astro
git commit -m "Drop Fraunces weight 500 to reduce font payload"
```

---

## Final Manual Check

After all tasks are committed:

```bash
npm run preview
```

Open the home page, a blog post, and the blog index. Verify:
- No JS errors in the browser console
- Carbon badge appears in the footer
- Copy and Share buttons on blog posts work
- Headings, wordmark, and post titles render correctly at the lighter weight
