# Carbon Badge Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the carbon badge truthful and correct on all pages for both mobile and desktop by fixing three specific defects: missing HTML document bytes, a "0.00" rendering lie, and a byte fallback that inflates measurements with HTTP header overhead.

**Architecture:** All changes are confined to `src/components/CarbonBadge.astro`. No new files, no new abstractions. Four targeted edits: (1) switch the `render` function from a string-based DOM write to element construction (removes a latent XSS surface), (2) guard against a near-zero display with a `<0.01` label, (3) re-add the navigation timing entry using `decodedBodySize` as the fallback instead of `transferSize`, (4) fix the resource byte fallback chain to prefer `decodedBodySize` over `transferSize`.

**Tech Stack:** Astro 5, browser Performance API (PerformanceNavigationTiming, PerformanceResourceTiming), Cloudflare Pages Functions, websitecarbon.com API.

---

## Background

The badge measures page weight by summing `performance.getEntriesByType("resource")` entries and then calling `/api/carbon?bytes=X&green=1` which proxies to `api.websitecarbon.com/data`. The response fields `gco2e` and `cleanerThan` drive the display.

Three defects were found during this audit:

### Problem 1 — HTML document excluded from byte count

`performance.getEntriesByType("resource")` returns **subresource** timings (JS, CSS, fonts, images). It does **not** include the HTML document itself. The navigation timing entry (`performance.getEntriesByType("navigation")[0]`) covers the document.

This entry was added in commit `bbf459d` then reverted in `d0c4bab` because on pages where resource entries were all zero (cross-origin CORS-restricted, or Vite-inlined assets), the HTML bytes alone (~3–5 KB) fed a value too small for `toFixed(2)` — it rendered as "0.00", which looked like a bug. The revert reinstated badge-absent behaviour for those pages, trading a misleading value for an invisible one.

The correct fix is two-pronged: re-add the navigation entry AND fix the renderer so near-zero values show `<0.01` instead of `0.00`.

### Problem 2 — "0.00 g CO₂/view" is a display lie

`gco2e.toFixed(2)` can produce `"0.00"` whenever `gco2e < 0.005`. This happens on very lightweight pages (nav entry only, or a handful of small resources). A visitor reading "0.00 g CO₂/view" cannot tell whether the page genuinely produced sub-0.01 grams or whether measurement failed. The honest display is `<0.01`.

### Problem 3 — `transferSize` fallback inflates bytes

The current fallback `r.encodedBodySize || r.transferSize || 0` reaches for `transferSize` when `encodedBodySize` is zero. `transferSize` **includes HTTP response headers** (typically 100–500 bytes per resource). For a page with 10 resources, this can add 1–5 KB of phantom bytes to the measurement.

The correct fallback is `decodedBodySize`, which is the uncompressed payload and never includes headers. It is always non-zero for same-origin resources regardless of cache state. Cross-origin resources without `Timing-Allow-Origin` will still report zero — there is no way around that limitation from the client.

---

## File Map

| Action | File |
|---|---|
| Modify | `src/components/CarbonBadge.astro` |

---

## Task 1: Rewrite `render` to use DOM element construction + fix the `<0.01` display

**Files:**
- Modify: `src/components/CarbonBadge.astro:21-24`

The current render function uses a template-literal string write to set the badge content. Replace it with explicit element construction. This removes the latent XSS surface (even though `grams` and `pct` are derived from numbers and are safe today, it is better practice) and simultaneously fixes the `0.00` display issue.

- [ ] **Step 1: Replace the `render` function body**

In `src/components/CarbonBadge.astro`, find the current `render` function:

```ts
function render(gco2e: number, cleanerThan: number) {
  const grams = gco2e.toFixed(2);
  const pct = Math.round(cleanerThan * 100);
  el.innerHTML = `<a href="https://www.websitecarbon.com" rel="noopener noreferrer" title="Cleaner than ${pct}% of pages tested — Website Carbon">${grams}&thinsp;g CO₂/view</a>`;
}
```

Replace it with:

```ts
function render(gco2e: number, cleanerThan: number) {
  const grams = gco2e < 0.005 ? "<0.01" : gco2e.toFixed(2);
  const pct = Math.round(cleanerThan * 100);
  const a = document.createElement("a");
  a.href = "https://www.websitecarbon.com";
  a.rel = "noopener noreferrer";
  a.title = `Cleaner than ${pct}% of pages tested — Website Carbon`;
  a.textContent = `${grams} g CO₂/view`;
  el.replaceChildren(a);
}
```

Notes:
- ` ` is U+2009 THIN SPACE (same glyph as the HTML entity `&thinsp;`).
- `₂` is the Unicode subscript-2 in CO₂.
- `gco2e < 0.005` catches everything that would round to "0.00" with `toFixed(2)`.
- `replaceChildren(a)` clears existing children and appends `a` in one operation — equivalent to the previous `innerHTML` write but using the DOM API.

- [ ] **Step 2: Run tests and build**

```bash
npm run test && npm run build
```

Expected: all Vitest tests pass, build exits 0 with no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CarbonBadge.astro
git commit -m "Fix carbon badge: DOM element construction + <0.01 for near-zero values

Switch render() from innerHTML string write to explicit element
construction. Add <0.01 guard: gco2e.toFixed(2) produces '0.00'
for any value under 0.005 — render '<0.01' instead to avoid
showing a display that looks like a measurement failure."
```

---

## Task 2: Re-add navigation timing entry and fix byte fallback chain

**Files:**
- Modify: `src/components/CarbonBadge.astro:38-46`

The current `fetchAndRender` opens with:

```ts
function fetchAndRender() {
  let bytes = 0;
  for (const r of performance.getEntriesByType(
    "resource"
  ) as PerformanceResourceTiming[]) {
    bytes += r.encodedBodySize || r.transferSize || 0;
  }
```

Replace that opening block with:

```ts
function fetchAndRender() {
  const nav = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming | undefined;
  let bytes = nav
    ? nav.encodedBodySize || nav.decodedBodySize || 0
    : 0;
  for (const r of performance.getEntriesByType(
    "resource"
  ) as PerformanceResourceTiming[]) {
    bytes += r.encodedBodySize || r.decodedBodySize || 0;
  }
```

Two changes:
- Navigation entry re-added with `encodedBodySize` (compressed wire size, preferred) falling back to `decodedBodySize` (uncompressed payload, always non-zero for same-origin). Never falls back to `transferSize` which would include header bytes.
- Resource entries: same fallback chain change — `|| transferSize` removed, replaced with `|| decodedBodySize`.

`decodedBodySize` is reliably non-zero for any same-origin resource (network or cache). When used as a fallback it slightly overcounts (uncompressed > compressed), but it is honest: every byte of content is accounted for. The overcount is small — Brotli/gzip compression ratios for text are typically 3–10×, so a 5 KB HTML document might report ~12 KB uncompressed, but this is vastly preferable to reporting 0 KB and hiding the badge entirely.

- [ ] **Step 1: Apply the edit**

Make the replacement above in `src/components/CarbonBadge.astro`.

- [ ] **Step 2: Run tests and build**

```bash
npm run test && npm run build
```

Expected: all Vitest tests pass, build exits 0.

- [ ] **Step 3: Start the dev server and verify on desktop**

```bash
npm run dev
```

Open `http://localhost:4321` in a desktop browser. Open DevTools → Network. Hard-reload (Cmd+Shift+R / Ctrl+Shift+R) to bypass disk cache. Within ~2 seconds of the load completing, the footer should display something like `0.08 g CO₂/view` or `<0.01 g CO₂/view`. The value should be non-empty.

Then navigate to `/now` and `/uses` (pages with heavily-inlined assets that previously showed no badge). These should now display a value since the navigation entry provides the HTML document bytes.

- [ ] **Step 4: Verify on mobile viewport**

In DevTools, switch to a mobile viewport (e.g. iPhone 12 Pro in the device toolbar). Hard-reload. The badge should appear in the footer with a value.

- [ ] **Step 5: Confirm `0.00` never appears**

Open DevTools → Console and run:

```js
const cases = [0, 0.001, 0.004, 0.0049, 0.005, 0.1, 1.234];
cases.forEach(v => {
  const grams = v < 0.005 ? "<0.01" : v.toFixed(2);
  console.assert(grams !== "0.00", `${v} should not produce 0.00, got: ${grams}`);
  console.log(v, "=>", grams);
});
```

All assertions should pass. `0` and `0.001` should both produce `<0.01`. `0.005` should produce `"0.01"`.

- [ ] **Step 6: Commit**

```bash
git add src/components/CarbonBadge.astro
git commit -m "Re-add HTML document bytes to carbon badge measurement

Include the navigation timing entry so the HTML document size is
counted. Use decodedBodySize as fallback for both nav and resource
entries rather than transferSize — decodedBodySize is the
uncompressed payload and never includes HTTP header overhead.

Pages with inlined assets (/now, /uses) now show a badge value
rather than silently hiding because resource entries were empty."
```

---

## Task 3: Verify the `green=true` claim is accurate

This is a verification task only — no code change expected.

The badge passes `green=1` to the API for every page. This tells the websitecarbon.com API to apply reduced carbon factors for renewable-energy hosting. If the claim is wrong, every measurement is materially understated.

- [ ] **Step 1: Check the live domain against the Green Web Foundation directory**

Open this URL in a browser (replace `timothybrits.com` with the live production domain if different):

```
https://www.thegreenwebfoundation.org/green-web-check/?url=timothybrits.com
```

Expected result: the check shows the host is verified as green. Cloudflare (which powers Cloudflare Pages) is in the Green Web Foundation's database and has published a public commitment to 100% renewable energy matching.

- [ ] **Step 2: If verified green — no code change needed**

`CarbonBadge.astro` correctly defaults `green` to `true`, and `Layout.astro` correctly calls `<CarbonBadge />` without overriding the prop. Done.

- [ ] **Step 3: If NOT verified green — update the prop default**

If the check returns "not green", change line 6 of `src/components/CarbonBadge.astro`:

```diff
-const { green = true } = Astro.props;
+const { green = false } = Astro.props;
```

Then run `npm run build` and commit:

```bash
git add src/components/CarbonBadge.astro
git commit -m "Set carbon badge green=false: host not in Green Web Foundation directory"
```

---

## Final Verification

After all tasks are committed:

```bash
npm run build && npm run preview
```

Open `http://localhost:4321`. Check each page:

| Page | Expected |
|---|---|
| `/` (home) | Badge shows, e.g. `0.08 g CO₂/view` |
| `/blog` | Badge shows |
| `/blog/<any-post>` | Badge shows |
| `/now` | Badge shows (previously absent due to inlined assets) |
| `/uses` | Badge shows (previously absent due to inlined assets) |

On each page: inspect the badge element in the footer. Confirm:
- The `<a>` element is present with `href="https://www.websitecarbon.com"`
- The text is `X.XX g CO₂/view` or `<0.01 g CO₂/view`
- The text is **never** `0.00 g CO₂/view`

Clear localStorage in DevTools → Application → Local Storage → Clear All, then hard-reload to confirm the badge fetches fresh data and renders correctly without a cache hit.

---

## Self-Review

**Spec coverage:**
- Problem 1 (missing HTML bytes): covered by Task 2
- Problem 2 ("0.00" display lie): covered by Task 1
- Problem 3 (`transferSize` inflation): covered by Task 2 (same edit, different line)
- XSS surface in render: covered by Task 1 (DOM element construction)
- Mobile/desktop correctness: verified in Task 2 Steps 3–4
- `green` accuracy: covered by Task 3

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `PerformanceNavigationTiming` and `PerformanceResourceTiming` are used consistently with the existing cast pattern in the file. `nav` and `r` are both typed via `as` casts matching the existing style.
