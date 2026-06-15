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

export function formatDate(date: Date): string {
  return date.toLocaleDateString(DATE_LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(DATE_LOCALE, {
    year: "numeric",
    month: "long",
  });
}

export const SITE_TITLE = "Fieldnotes";
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

const mdProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkSmartypants, SMARTYPANTS_OPTIONS)
  .use(remarkRehype)
  .use(rehypeExternalLinks, EXTERNAL_LINKS_OPTIONS)
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

export function computeReadingTime(body?: string): string {
  const tree = mdProcessor.parse(body ?? "");
  return readingTime(mdastToString(tree)).text;
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
