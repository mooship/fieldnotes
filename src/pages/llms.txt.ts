import type { APIContext } from "astro";
import {
  BLOG_DESCRIPTION,
  getBlogPosts,
  getPostUrl,
  getSiteUrl,
} from "../lib/blog";

/**
 * Serves `/llms.txt`, an AI-crawler-friendly Markdown index of every page
 * and published post. Draft posts are excluded automatically since it's
 * built from `getBlogPosts()`.
 */
export async function GET(context: APIContext) {
  const site = getSiteUrl(context.site);
  const posts = await getBlogPosts();

  const lines = [
    "# Fieldnotes",
    "",
    `> ${BLOG_DESCRIPTION}`,
    "",
    "## Pages",
    "",
    `- [Blog](${site}/blog): ${BLOG_DESCRIPTION}`,
    `- [Tags](${site}/blog/tags): Browse posts by tag.`,
    `- [Now](${site}/now): What I'm currently working on, reading, and learning.`,
    `- [Uses](${site}/uses): The tools, hardware, and software I use daily.`,
    `- [Colophon](${site}/colophon): How this site is built, designed, and hosted.`,
    `- [Play](${site}/play): A small Breakout clone built out of the same squares and rules as the rest of the site.`,
    "",
    "## Posts",
    "",
    ...posts.map(
      (post) =>
        `- [${post.data.title}](${getPostUrl(site, post.id)}): ${post.data.description}`
    ),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
