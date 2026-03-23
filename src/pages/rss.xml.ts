import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { BLOG_DESCRIPTION, getBlogPosts, getPostSlug } from "../lib/blog";

export async function GET(context: APIContext) {
  const posts = await getBlogPosts();

  return rss({
    title: "Timothy Brits",
    description: BLOG_DESCRIPTION,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${getPostSlug(post.id)}`,
    })),
  });
}
