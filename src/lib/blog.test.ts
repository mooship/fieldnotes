import { describe, expect, it, vi } from "vitest";
import {
  getAdjacentPosts,
  getAllTags,
  getBlogPosts,
  getFeedItems,
  getPostsByTag,
  getPostSlug,
  getReadingTime,
  getRelatedPosts,
  getSeriesPosts,
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

describe("getAdjacentPosts", () => {
  const posts = [
    { id: "newest.md", data: { title: "Newest Post" } },
    { id: "middle.md", data: { title: "Middle Post" } },
    { id: "oldest.md", data: { title: "Oldest Post" } },
  ];

  it("returns both prev and next for a middle post", () => {
    const result = getAdjacentPosts(posts, "middle");
    expect(result.prev).toEqual({ slug: "oldest", title: "Oldest Post" });
    expect(result.next).toEqual({ slug: "newest", title: "Newest Post" });
  });

  it("returns no next for the newest post", () => {
    const result = getAdjacentPosts(posts, "newest");
    expect(result.next).toBeUndefined();
    expect(result.prev).toEqual({ slug: "middle", title: "Middle Post" });
  });

  it("returns no prev for the oldest post", () => {
    const result = getAdjacentPosts(posts, "oldest");
    expect(result.prev).toBeUndefined();
    expect(result.next).toEqual({ slug: "middle", title: "Middle Post" });
  });

  it("returns both undefined for an unknown slug", () => {
    const result = getAdjacentPosts(posts, "unknown");
    expect(result.prev).toBeUndefined();
    expect(result.next).toBeUndefined();
  });
});

describe("getAllTags", () => {
  it("returns sorted unique tags from all posts", () => {
    const posts = [
      { data: { tags: ["personal", "technology"] } },
      { data: { tags: ["technology", "philosophy"] } },
      { data: { tags: ["personal"] } },
    ];
    expect(getAllTags(posts)).toEqual(["personal", "philosophy", "technology"]);
  });

  it("returns empty array when no posts have tags", () => {
    const posts = [{ data: { tags: [] } }, { data: { tags: [] } }];
    expect(getAllTags(posts)).toEqual([]);
  });
});

describe("getPostsByTag", () => {
  const posts = [
    { data: { tags: ["personal", "technology"] } },
    { data: { tags: ["philosophy"] } },
    { data: { tags: ["personal"] } },
  ];

  it("filters posts by tag", () => {
    expect(getPostsByTag(posts, "personal")).toHaveLength(2);
  });

  it("returns empty array for unknown tag", () => {
    expect(getPostsByTag(posts, "unknown")).toHaveLength(0);
  });
});

type Post = { id: string; data: { draft: boolean; pubDate: Date } };

function setupPosts(posts: Post[]) {
  mockGetCollection.mockImplementation(
    async (_col: unknown, filter: (p: unknown) => boolean) =>
      filter ? posts.filter((p) => filter(p)) : posts
  );
}

describe("getSeriesPosts", () => {
  const posts = [
    {
      id: "c.md",
      data: {
        title: "Part 3",
        series: "my-series",
        seriesOrder: 3,
        pubDate: new Date("2024-03-01"),
      },
    },
    {
      id: "a.md",
      data: {
        title: "Part 1",
        series: "my-series",
        seriesOrder: 1,
        pubDate: new Date("2024-01-01"),
      },
    },
    {
      id: "b.md",
      data: {
        title: "Part 2",
        series: "my-series",
        seriesOrder: 2,
        pubDate: new Date("2024-02-01"),
      },
    },
    {
      id: "other.md",
      data: {
        title: "Other",
        series: "other-series",
        seriesOrder: 1,
        pubDate: new Date("2024-01-15"),
      },
    },
  ];

  it("returns posts in a series sorted by seriesOrder", () => {
    const result = getSeriesPosts(posts, "my-series");
    expect(result.map((p) => p.data.title)).toEqual([
      "Part 1",
      "Part 2",
      "Part 3",
    ]);
  });

  it("excludes posts from other series", () => {
    const result = getSeriesPosts(posts, "my-series");
    expect(result).toHaveLength(3);
  });

  it("falls back to pubDate when seriesOrder is missing", () => {
    const noPosts = [
      {
        id: "b.md",
        data: {
          title: "Second",
          series: "s",
          pubDate: new Date("2024-02-01"),
        },
      },
      {
        id: "a.md",
        data: {
          title: "First",
          series: "s",
          pubDate: new Date("2024-01-01"),
        },
      },
    ];
    const result = getSeriesPosts(noPosts, "s");
    expect(result.map((p) => p.data.title)).toEqual(["First", "Second"]);
  });
});

describe("getRelatedPosts", () => {
  const posts = [
    {
      id: "a.md",
      data: {
        title: "Post A",
        tags: ["tech", "personal"],
        pubDate: new Date("2024-01-01"),
      },
    },
    {
      id: "b.md",
      data: {
        title: "Post B",
        tags: ["tech", "philosophy"],
        pubDate: new Date("2024-02-01"),
      },
    },
    {
      id: "c.md",
      data: {
        title: "Post C",
        tags: ["personal", "philosophy"],
        pubDate: new Date("2024-03-01"),
      },
    },
    {
      id: "d.md",
      data: {
        title: "Post D",
        tags: ["unrelated"],
        pubDate: new Date("2024-04-01"),
      },
    },
  ];

  it("returns posts sorted by shared tag count", () => {
    const current = posts[0];
    const result = getRelatedPosts(posts, current);
    expect(result.map((p) => p.data.title)).toEqual(["Post C", "Post B"]);
  });

  it("excludes the current post", () => {
    const current = posts[0];
    const result = getRelatedPosts(posts, current);
    expect(result.every((p) => p.id !== current.id)).toBe(true);
  });

  it("excludes posts with no shared tags", () => {
    const current = posts[0];
    const result = getRelatedPosts(posts, current);
    expect(result.find((p) => p.data.title === "Post D")).toBeUndefined();
  });

  it("respects the limit parameter", () => {
    const current = posts[0];
    const result = getRelatedPosts(posts, current, 1);
    expect(result).toHaveLength(1);
  });
});

describe("getReadingTime", () => {
  it("returns the readingTime string when present", () => {
    expect(getReadingTime({ readingTime: "3 min read" })).toBe("3 min read");
  });

  it("returns undefined when readingTime is missing", () => {
    expect(getReadingTime({})).toBeUndefined();
  });

  it("returns undefined when readingTime is not a string", () => {
    expect(getReadingTime({ readingTime: 42 })).toBeUndefined();
  });
});

describe("getFeedItems", () => {
  it("returns feed items with rendered HTML and correct URLs", async () => {
    mockGetCollection.mockResolvedValue([
      {
        id: "test-post.md",
        data: {
          title: "Test Post",
          description: "A test",
          pubDate: new Date("2024-06-01"),
          updatedDate: new Date("2024-06-15"),
          tags: ["tech"],
          draft: false,
        },
        body: "Hello **world**",
      },
    ]);

    const items = await getFeedItems("https://example.com");
    expect(items).toHaveLength(1);
    expect(items[0].url).toBe("https://example.com/blog/test-post");
    expect(items[0].title).toBe("Test Post");
    expect(items[0].description).toBe("A test");
    expect(items[0].html).toContain("<strong>world</strong>");
    expect(items[0].pubDate).toEqual(new Date("2024-06-01"));
    expect(items[0].updatedDate).toEqual(new Date("2024-06-15"));
    expect(items[0].tags).toEqual(["tech"]);
  });

  it("uses pubDate as updatedDate when updatedDate is missing", async () => {
    const pubDate = new Date("2024-06-01");
    mockGetCollection.mockResolvedValue([
      {
        id: "no-update.md",
        data: {
          title: "No Update",
          description: "Desc",
          pubDate,
          tags: [],
          draft: false,
        },
        body: "Content",
      },
    ]);

    const items = await getFeedItems("https://example.com");
    expect(items[0].updatedDate).toEqual(pubDate);
  });
});

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
