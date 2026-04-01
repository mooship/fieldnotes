import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import {
  BLOG_DESCRIPTION,
  getBlogPosts,
  getPostSlug,
  renderMarkdownToHtml,
} from "../lib/blog";

export async function GET(context: APIContext) {
  const posts = await getBlogPosts();

  const items = await Promise.all(
    posts.map(async (post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      content: await renderMarkdownToHtml(post.body),
      categories: post.data.tags,
      link: `/blog/${getPostSlug(post.id)}`,
    }))
  );

  return rss({
    title: "Timothy Brits",
    description: BLOG_DESCRIPTION,
    site: context.site!,
    items,
  });
}
