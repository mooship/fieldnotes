import type { APIContext } from "astro";
import {
  BLOG_DESCRIPTION,
  getBlogPosts,
  getPostSlug,
  getSiteUrl,
} from "../lib/blog";

export async function GET(context: APIContext) {
  const site = getSiteUrl(context.site);
  const posts = await getBlogPosts();

  const postLinks = posts
    .map(
      (post) => `- [${post.data.title}](${site}/blog/${getPostSlug(post.id)})`
    )
    .join("\n");

  const lines = [
    "# Fieldnotes",
    "",
    `> ${BLOG_DESCRIPTION}`,
    "",
    "## Pages",
    "",
    `- [Blog](${site}/blog): All posts, newest first.`,
    `- [Now](${site}/now): What I'm currently doing.`,
    `- [Uses](${site}/uses): Hardware and software I use.`,
    "",
    "## Posts",
    "",
    postLinks,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
