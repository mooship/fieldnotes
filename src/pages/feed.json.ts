import type { APIContext } from "astro";
import { BLOG_DESCRIPTION, getFeedItems, getSiteUrl } from "../lib/blog";

export async function GET(context: APIContext) {
  const site = getSiteUrl(context.site!);
  const items = await getFeedItems(site);

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "Timothy Brits",
    home_page_url: site,
    feed_url: `${site}/feed.json`,
    description: BLOG_DESCRIPTION,
    authors: [{ name: "Timothy Brits", url: site }],
    items: items.map((item) => ({
      id: item.url,
      url: item.url,
      title: item.title,
      summary: item.description,
      content_html: item.html,
      date_published: item.pubDate.toISOString(),
      date_modified: item.updatedDate.toISOString(),
      tags: item.tags,
    })),
  };

  return Response.json(feed, {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" },
  });
}
