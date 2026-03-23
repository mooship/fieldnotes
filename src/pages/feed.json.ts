import type { APIContext } from "astro";
import {
  BLOG_DESCRIPTION,
  getBlogPosts,
  getPostSlug,
  getSiteUrl,
  renderMarkdownToHtml,
} from "../lib/blog";

export async function GET(context: APIContext) {
  const site = getSiteUrl(context.site!);
  const posts = await getBlogPosts();

  const items = await Promise.all(
    posts.map(async (post) => {
      const url = `${site}/blog/${getPostSlug(post.id)}`;
      return {
        id: url,
        url,
        title: post.data.title,
        summary: post.data.description,
        content_html: await renderMarkdownToHtml(post.body ?? ""),
        date_published: post.data.pubDate.toISOString(),
        date_modified: (
          post.data.updatedDate ?? post.data.pubDate
        ).toISOString(),
      };
    })
  );

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Timothy Brits",
    home_page_url: site,
    feed_url: `${site}/feed.json`,
    description: BLOG_DESCRIPTION,
    authors: [{ name: "Timothy Brits", url: site }],
    items,
  };

  return new Response(JSON.stringify(feed), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
