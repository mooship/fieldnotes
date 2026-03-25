import { describe, expect, it, vi } from "vitest";
import {
  getBlogPosts,
  getPostSlug,
  getSiteUrl,
  renderMarkdownToHtml,
} from "./blog";

const mockGetCollection = vi.hoisted(() => vi.fn());

vi.mock("astro:content", () => ({
  getCollection: mockGetCollection,
}));

function parseHtml(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("getPostSlug", () => {
  it("removes .md extension", () => {
    expect(getPostSlug("hello-world.md")).toBe("hello-world");
  });

  it("removes .mdx extension", () => {
    expect(getPostSlug("on-buddhism.mdx")).toBe("on-buddhism");
  });

  it("leaves a slug without an extension unchanged", () => {
    expect(getPostSlug("no-extension")).toBe("no-extension");
  });
});

describe("getSiteUrl", () => {
  it("strips trailing slash", () => {
    expect(getSiteUrl(new URL("https://example.com/"))).toBe(
      "https://example.com"
    );
  });

  it("leaves a url without a trailing slash unchanged", () => {
    expect(getSiteUrl(new URL("https://example.com"))).toBe(
      "https://example.com"
    );
  });

  it("strips trailing slash from a path url", () => {
    expect(getSiteUrl(new URL("https://example.com/path/"))).toBe(
      "https://example.com/path"
    );
  });
});

describe("renderMarkdownToHtml", () => {
  it("wraps plain text in a paragraph", async () => {
    const doc = parseHtml(await renderMarkdownToHtml("Hello."));
    expect(doc.querySelector("p")?.textContent).toBe("Hello.");
  });

  it("converts bold markdown to a strong element", async () => {
    const doc = parseHtml(await renderMarkdownToHtml("**bold**"));
    expect(doc.querySelector("strong")?.textContent).toBe("bold");
  });

  it("converts straight double quotes to smart quotes", async () => {
    const doc = parseHtml(await renderMarkdownToHtml('"hello"'));
    expect(doc.querySelector("p")?.textContent).toBe("\u201Chello\u201D");
  });

  it("returns empty string for empty input", async () => {
    expect(await renderMarkdownToHtml("")).toBe("");
  });
});

type Post = { id: string; data: { draft: boolean; pubDate: Date } };

function setupPosts(posts: Post[]) {
  mockGetCollection.mockImplementation(
    async (_col: unknown, filter: (p: unknown) => boolean) =>
      filter ? posts.filter((p) => filter(p)) : posts
  );
}

describe("getBlogPosts", () => {
  it("filters out draft posts", async () => {
    setupPosts([
      {
        id: "published.md",
        data: { draft: false, pubDate: new Date("2024-01-01") },
      },
      {
        id: "draft.md",
        data: { draft: true, pubDate: new Date("2024-02-01") },
      },
    ]);

    const posts = await getBlogPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("published.md");
  });

  it("sorts posts by pubDate descending", async () => {
    setupPosts([
      {
        id: "older.md",
        data: { draft: false, pubDate: new Date("2024-01-01") },
      },
      {
        id: "newer.md",
        data: { draft: false, pubDate: new Date("2024-06-01") },
      },
      {
        id: "middle.md",
        data: { draft: false, pubDate: new Date("2024-03-01") },
      },
    ]);

    const posts = await getBlogPosts();
    expect(posts.map((p) => p.id)).toEqual([
      "newer.md",
      "middle.md",
      "older.md",
    ]);
  });
});
