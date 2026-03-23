import { getCollection } from "astro:content";

export const BLOG_DESCRIPTION =
  "Writing by Timothy Brits on technology, open source, and related topics.";

export function getPostSlug(id: string): string {
  return id.replace(/\.mdx?$/, "");
}

export function getSiteUrl(site: URL): string {
  return site.toString().replace(/\/$/, "");
}

export async function getBlogPosts() {
  return (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
