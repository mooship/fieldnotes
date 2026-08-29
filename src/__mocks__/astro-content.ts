/**
 * Test-only stand-in for `astro:content`, a virtual module that only exists
 * inside the Astro runtime. `vitest.config.ts` aliases `astro:content` to
 * this file so `src/lib/blog.ts` can be imported under Vitest; tests that
 * need real data override this via `vi.mock("astro:content", ...)`.
 */
export function getCollection() {
  return Promise.resolve([]);
}
