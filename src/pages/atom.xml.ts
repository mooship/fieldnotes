import type { APIContext } from "astro";
import { BLOG_DESCRIPTION, getBlogPosts, getPostSlug, getSiteUrl } from "../lib/blog";

function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(context: APIContext) {
  const site = getSiteUrl(context.site!);
  const posts = await getBlogPosts();

  const updated =
    posts.length > 0 ? posts[0].data.pubDate.toISOString() : new Date().toISOString();

  const entries = posts
    .map((post) => {
      const url = `${site}/blog/${getPostSlug(post.id)}`;
      const published = post.data.pubDate.toISOString();
      const modified = (post.data.updatedDate ?? post.data.pubDate).toISOString();
      return `  <entry>
    <id>${url}</id>
    <title>${xmlEscape(post.data.title)}</title>
    <updated>${modified}</updated>
    <published>${published}</published>
    <summary>${xmlEscape(post.data.description)}</summary>
    <link href="${url}" />
  </entry>`;
    })
    .join("\n");

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
