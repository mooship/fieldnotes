import { getCollection } from "astro:content";
import { toString as mdastToString } from "mdast-util-to-string";
import readingTime from "reading-time";
import rehypeExternalLinks from "rehype-external-links";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSmartypants from "remark-smartypants";
import { unified } from "unified";
import { EXTERNAL_LINKS_OPTIONS, SMARTYPANTS_OPTIONS } from "./markdown-config";

const DATE_LOCALE = "en-ZA";

/**
Formats a date as a full day/month/year string, e.g. "15 March 2024".
*/
export function formatDate(date: Date): string {
  return date.toLocaleDateString(DATE_LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
Formats a date as a month/year string, e.g. "March 2024".
*/
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(DATE_LOCALE, {
    year: "numeric",
    month: "long",
  });
}

export const SITE_TITLE = "Fieldnotes";
export const SITE_AUTHOR = "Timothy Brits";
export const BLOG_DESCRIPTION =
  "Writing by Timothy Brits on software and open source.";

/**
Derives a post's URL slug from its content collection id, e.g. "my-post.md" -> "my-post".
*/
export function getPostSlug(id: string): string {
  return id.replace(/\.md$/, "");
}

/**
Builds the absolute URL for a post from a site origin and its content collection id.
*/
export function getPostUrl(siteUrl: string, id: string): string {
  return `${siteUrl}/blog/${getPostSlug(id)}`;
}

/**
 * Normalizes Astro's `site` config value to a trailing-slash-free origin
 * string. Throws if `site` isn't set, since every caller needs an absolute
 * URL (feeds, sitemap, OG images, `llms.txt`).
 */
export function getSiteUrl(site?: URL): string {
  if (!site) throw new Error("site must be set in astro.config.mjs");
  return site.href.replace(/\/$/, "");
}

/**
 * Shared remark/rehype pipeline for post bodies. Built once at module scope
 * so its plugin configuration is identical everywhere it's used (post pages,
 * feeds, reading-time estimation) and isn't rebuilt per call.
 */
const mdProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants, SMARTYPANTS_OPTIONS)
  .use(remarkRehype)
  .use(rehypeExternalLinks, EXTERNAL_LINKS_OPTIONS)
  .use(rehypeStringify);

/**
Renders a post's Markdown body to an HTML string using the shared pipeline.
*/
export async function renderMarkdownToHtml(markdown?: string): Promise<string> {
  return String(await mdProcessor.process(markdown ?? ""));
}

/**
Returns all non-draft blog posts, sorted newest `pubDate` first.
*/
export async function getBlogPosts() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.toSorted(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
}

/**
 * Estimates reading time (e.g. "3 min read") for a post body. Parses the
 * Markdown to a syntax tree first so formatting characters aren't counted
 * as words.
 */
export function computeReadingTime(body?: string): string {
  const tree = mdProcessor.parse(body ?? "");
  return readingTime(mdastToString(tree)).text;
}

/**
Converts a tag to a URL-safe slug, e.g. "Web Dev" -> "web-dev".
*/
export function getTagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

export interface TagSummary {
  tag: string;
  slug: string;
  count: number;
}

interface TaggedPost {
  data: { tags: string[] };
}

/**
 * Returns every distinct tag used across `posts`, alphabetically sorted,
 * with a URL slug and how many posts carry it. Two differently-cased or
 * -spaced tags that slugify to the same value are counted together, under
 * whichever spelling was seen first.
 */
export function getAllTags(posts: TaggedPost[]): TagSummary[] {
  const bySlug = new Map<string, TagSummary>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = getTagSlug(tag);
      const existing = bySlug.get(slug);
      if (existing) existing.count += 1;
      else bySlug.set(slug, { tag, slug, count: 1 });
    }
  }
  return bySlug
    .values()
    .toArray()
    .toSorted((a, b) => a.tag.localeCompare(b.tag));
}

/**
Filters `posts` down to those carrying a tag that slugifies to `tagSlug`.
*/
export function getPostsByTag<T extends TaggedPost>(
  posts: T[],
  tagSlug: string
): T[] {
  return posts.filter((post) =>
    post.data.tags.some((tag) => getTagSlug(tag) === tagSlug)
  );
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

/**
 * Finds the posts adjacent to `currentSlug` within an already-sorted list.
 * Because `posts` is newest-first, `prev` (older) sits at the next index and
 * `next` (newer) sits at the previous index. Returns both as `undefined`
 * when `currentSlug` isn't found, or when at either end of the list.
 */
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
