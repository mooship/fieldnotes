import type { APIContext } from "astro";
import {
  BLOG_DESCRIPTION,
  getBlogPosts,
  getPostSlug,
  getSiteUrl,
  renderMarkdownToHtml,
} from "../lib/blog";

function xmlEscape(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(context: APIContext) {
  const site = getSiteUrl(context.site!);
  const posts = await getBlogPosts();

  const updated =
    posts.length > 0
      ? new Date(
          Math.max(
            ...posts.map((p) =>
              (p.data.updatedDate ?? p.data.pubDate).getTime()
            )
          )
        ).toISOString()
      : new Date().toISOString();

  const entryList = await Promise.all(
    posts.map(async (post) => {
      const url = `${site}/blog/${getPostSlug(post.id)}`;
      const published = post.data.pubDate.toISOString();
      const modified = (
        post.data.updatedDate ?? post.data.pubDate
      ).toISOString();
      const html = await renderMarkdownToHtml(post.body ?? "");
      return `  <entry>
    <id>${url}</id>
    <title>${xmlEscape(post.data.title)}</title>
    <updated>${modified}</updated>
    <published>${published}</published>
    <summary>${xmlEscape(post.data.description)}</summary>
    <content type="html">${xmlEscape(html)}</content>
    <link href="${url}" />
  </entry>`;
    })
  );
  const entries = entryList.join("\n");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${site}/atom.xml</id>
  <title>Timothy Brits</title>
  <subtitle>${xmlEscape(BLOG_DESCRIPTION)}</subtitle>
  <updated>${updated}</updated>
  <author>
    <name>Timothy Brits</name>
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
