export const SMARTYPANTS_OPTIONS = { dashes: "inverted" } as const;

/**
 * Deliberately not `as const`: rehype-external-links types `rel` as a mutable
 * `string[]`, which a readonly tuple would not satisfy.
 */
export const EXTERNAL_LINKS_OPTIONS = { rel: ["noopener", "noreferrer"] };
