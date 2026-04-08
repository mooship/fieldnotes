import type { APIContext } from "astro";
import { BLOG_DESCRIPTION, getFeedItems, getSiteUrl, SITE_AUTHOR, SITE_TITLE } from "../lib/blog";
import { xmlEscape } from "../lib/xml";

export async function GET(context: APIContext) {
  const site = getSiteUrl(context.site!);
  const items = await getFeedItems(site);

  const updated =
    items.length > 0
      ? new Date(
          Math.max(...items.map((i) => i.updatedDate.getTime()))
        ).toISOString()
      : new Date().toISOString();

  const entries = items
    .map(
      (item) => `  <entry>
    <id>${item.url}</id>
    <title>${xmlEscape(item.title)}</title>
    <updated>${item.updatedDate.toISOString()}</updated>
    <published>${item.pubDate.toISOString()}</published>
    <summary>${xmlEscape(item.description)}</summary>
    <content type="html">${xmlEscape(item.html)}</content>
    <link href="${item.url}" />
${item.tags.map((tag) => `    <category term="${xmlEscape(tag)}" />`).join("\n")}
  </entry>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${site}/atom.xml</id>
  <title>${xmlEscape(SITE_TITLE)}</title>
  <subtitle>${xmlEscape(BLOG_DESCRIPTION)}</subtitle>
  <updated>${updated}</updated>
  <author>
    <name>${xmlEscape(SITE_AUTHOR)}</name>
    <uri>${site}</uri>
  </author>
  <link href="${site}" />
  <link rel="self" href="${site}/atom.xml" />
${entries}
</feed>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
