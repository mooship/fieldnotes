import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "zod";

/**
 * The blog post collection, loaded from `src/content/blog/*.md`. Frontmatter
 * `draft: true` posts pass this schema but are filtered out everywhere by
 * `getBlogPosts()` (`src/lib/blog.ts`), not here.
 */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
