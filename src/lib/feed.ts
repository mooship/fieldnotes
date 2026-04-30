import { getBlogPosts, getPostSlug, renderMarkdownToHtml } from "./blog";

export interface FeedItem {
  url: string;
  title: string;
  description: string;
  html: string;
  pubDate: Date;
  updatedDate: Date;
  tags: string[];
}

export async function getFeedItems(siteUrl: string): Promise<FeedItem[]> {
  const posts = await getBlogPosts();
  return Promise.all(
    posts.map(async (post) => ({
      url: `${siteUrl}/blog/${getPostSlug(post.id)}`,
      title: post.data.title,
      description: post.data.description,
      html: await renderMarkdownToHtml(post.body),
      pubDate: post.data.pubDate,
      updatedDate: post.data.updatedDate ?? post.data.pubDate,
      tags: post.data.tags,
    }))
  );
}
