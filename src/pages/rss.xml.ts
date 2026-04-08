import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { BLOG_DESCRIPTION, getFeedItems, getSiteUrl, SITE_TITLE } from "../lib/blog";

export async function GET(context: APIContext) {
  const site = getSiteUrl(context.site!);
  const items = await getFeedItems(site);

  return rss({
    title: SITE_TITLE,
    description: BLOG_DESCRIPTION,
    site: context.site!,
    items: items.map((item) => ({
      title: item.title,
      pubDate: item.pubDate,
      description: item.description,
      content: item.html,
      categories: item.tags,
      link: item.url,
    })),
  });
}
