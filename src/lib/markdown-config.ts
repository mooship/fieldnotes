/**
 * Shared plugin options for the Markdown pipeline, kept in one place so
 * `astro.config.mjs` (the Astro build pipeline) and `src/lib/blog.ts` (the
 * feed-rendering pipeline) stay in sync.
 */
export const SMARTYPANTS_OPTIONS = { dashes: "inverted" } as const;

/**
 * Deliberately not `as const`: rehype-external-links types `rel` as a mutable
 * `string[]`, which a readonly tuple would not satisfy.
 */
export const EXTERNAL_LINKS_OPTIONS = { rel: ["noopener", "noreferrer"] };
