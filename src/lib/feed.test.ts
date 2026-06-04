import { describe, expect, it, vi } from "vitest";
import { getFeedItems } from "./feed";

const mockGetCollection = vi.hoisted(() => vi.fn());

vi.mock("astro:content", () => ({
  getCollection: mockGetCollection,
}));

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
          draft: false,
        },
        body: "Content",
      },
    ]);

    const items = await getFeedItems("https://example.com");
    expect(items[0].updatedDate).toEqual(pubDate);
  });

  it("returns an empty array when there are no posts", async () => {
    mockGetCollection.mockResolvedValue([]);
    const items = await getFeedItems("https://example.com");
    expect(items).toEqual([]);
  });
});
