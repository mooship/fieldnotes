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

export function getSiteUrl(site: URL): string {
  return site.toString().replace(/\/$/, "");
}

const mdProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants)
  .use(remarkRehype)
  .use(rehypeStringify);

export async function renderMarkdownToHtml(
  markdown: string | undefined
): Promise<string> {
  return String(await mdProcessor.process(markdown ?? ""));
}

export async function getBlogPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.toSorted(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

export interface FeedItem {
  url: string;
  title: string;
  description: string;
  html: string;
  pubDate: Date;
  updatedDate: Date;
  tags: string[];
}

export async function getFeedItems(siteUrl: string): Promise<FeedItem[]> {
  const posts = await getBlogPosts();
  return Promise.all(
    posts.map(async (post) => ({
      url: `${siteUrl}/blog/${getPostSlug(post.id)}`,
      title: post.data.title,
      description: post.data.description,
      html: await renderMarkdownToHtml(post.body),
      pubDate: post.data.pubDate,
      updatedDate: post.data.updatedDate ?? post.data.pubDate,
      tags: post.data.tags,
    }))
  );
}

export function getReadingTime(
  remarkPluginFrontmatter: Record<string, unknown>
): string | undefined {
  const value = remarkPluginFrontmatter.readingTime;
  return typeof value === "string" ? value : undefined;
}

export function computeReadingTime(body: string | undefined): string {
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

export function getAdjacentPosts(
  posts: { id: string; data: { title: string } }[],
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

export function getAllTags(posts: { data: { tags: string[] } }[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].toSorted();
}

export function getPostsByTag(
  posts: { data: { tags: string[] } }[],
  tag: string
) {
  return posts.filter((post) => post.data.tags.includes(tag));
}

export function getSeriesPosts(
  posts: {
    id: string;
    data: {
      title: string;
      series?: string;
      seriesOrder?: number;
      pubDate: Date;
    };
  }[],
  seriesName: string
) {
  return posts
    .filter((post) => post.data.series === seriesName)
    .toSorted((a, b) => {
      const orderA = a.data.seriesOrder ?? Infinity;
      const orderB = b.data.seriesOrder ?? Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
    });
}

export function getRelatedPosts(
  posts: {
    id: string;
    data: { title: string; tags: string[]; pubDate: Date };
  }[],
  currentPost: {
    id: string;
    data: { tags: string[] };
  },
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
