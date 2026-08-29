import { getBlogPosts, getPostUrl, renderMarkdownToHtml } from "./blog";

/** A post normalized for feed output, shared across the RSS, Atom, and JSON Feed endpoints. */
export interface FeedItem {
  url: string;
  title: string;
  description: string;
  html: string;
  pubDate: Date;
  updatedDate: Date;
}

/**
 * Builds the feed items shared by `/rss.xml`, `/atom.xml`, and `/feed.json`
 * so all three stay in sync. `updatedDate` falls back to `pubDate` for posts
 * that have never been updated.
 */
export async function getFeedItems(siteUrl: string): Promise<FeedItem[]> {
  const posts = await getBlogPosts();
  return Promise.all(
    posts.map(async (post) => ({
      url: getPostUrl(siteUrl, post.id),
      title: post.data.title,
      description: post.data.description,
      html: await renderMarkdownToHtml(post.body),
      pubDate: post.data.pubDate,
      updatedDate: post.data.updatedDate ?? post.data.pubDate,
    }))
  );
}
