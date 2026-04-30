import { getCollection } from "astro:content";
import readingTime from "reading-time";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSmartypants from "remark-smartypants";
import { unified } from "unified";

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const SITE_TITLE = "Timothy Brits";
export const SITE_AUTHOR = "Timothy Brits";
export const BLOG_DESCRIPTION =
  "Writing by Timothy Brits on software, open source, Buddhism, and eco-socialism.";

export function getPostSlug(id: string): string {
  return id.replace(/\.md$/, "");
}

export function getSiteUrl(site?: URL): string {
  if (!site) throw new Error("site must be set in astro.config.mjs");
  return site.toString().replace(/\/$/, "");
}

// Must stay in sync with the remarkSmartypants config in astro.config.mjs.
const mdProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants, { dashes: "inverted" })
  .use(remarkRehype)
  .use(rehypeStringify);

export async function renderMarkdownToHtml(markdown?: string): Promise<string> {
  return String(await mdProcessor.process(markdown ?? ""));
}

export async function getBlogPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.toSorted(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

export function getReadingTime(
  remarkPluginFrontmatter: Record<string, unknown>
): string | undefined {
  const value = remarkPluginFrontmatter.readingTime;
  return typeof value === "string" ? value : undefined;
}

export function computeReadingTime(body?: string): string {
  return readingTime(body ?? "").text;
}

export interface AdjacentPost {
  slug: string;
  title: string;
}

export interface AdjacentPosts {
  prev: AdjacentPost | undefined;
  next: AdjacentPost | undefined;
}

interface NavigablePost {
  id: string;
  data: { title: string };
}

export function getAdjacentPosts(
  posts: NavigablePost[],
  currentSlug: string
): AdjacentPosts {
  const index = posts.findIndex((post) => getPostSlug(post.id) === currentSlug);
  if (index === -1) return { prev: undefined, next: undefined };

  const older = posts[index + 1];
  const newer = posts[index - 1];

  return {
    prev: older
      ? { slug: getPostSlug(older.id), title: older.data.title }
      : undefined,
    next: newer
      ? { slug: getPostSlug(newer.id), title: newer.data.title }
      : undefined,
  };
}

interface TaggedPost {
  data: { tags: string[] };
}

export function getAllTags(posts: TaggedPost[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].toSorted();
}

export function getPostsByTag<T extends TaggedPost>(
  posts: T[],
  tag: string
): T[] {
  return posts.filter((post) => post.data.tags.includes(tag));
}

interface SeriesPost {
  id: string;
  data: {
    title: string;
    series?: string;
    seriesOrder?: number;
    pubDate: Date;
  };
}

export function getSeriesPosts(posts: SeriesPost[], seriesName: string) {
  return posts
    .filter((post) => post.data.series === seriesName)
    .toSorted((a, b) => {
      const orderA = a.data.seriesOrder ?? Infinity;
      const orderB = b.data.seriesOrder ?? Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
    });
}

interface RelatedPost {
  id: string;
  data: { title: string; tags: string[]; pubDate: Date };
}

interface CurrentPost {
  id: string;
  data: { tags: string[] };
}

export function getRelatedPosts(
  posts: RelatedPost[],
  currentPost: CurrentPost,
  limit = 3
) {
  const currentTags = new Set(currentPost.data.tags);

  return posts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => ({
      post,
      score: post.data.tags.filter((tag) => currentTags.has(tag)).length,
    }))
    .filter(({ score }) => score > 0)
    .toSorted(
      (a, b) =>
        b.score - a.score ||
        b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf()
    )
    .slice(0, limit)
    .map(({ post }) => post);
}
