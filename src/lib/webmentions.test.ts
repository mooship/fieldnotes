import { afterEach, describe, expect, it, vi } from "vitest";
import { getWebmentions, summarizeWebmentions } from "./webmentions";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getWebmentions", () => {
  it("parses likes, reposts, replies, and mentions from the jf2 feed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          children: [
            { "wm-property": "like-of", url: "https://a.example/like" },
            { "wm-property": "repost-of", url: "https://a.example/repost" },
            {
              "wm-property": "in-reply-to",
              url: "https://a.example/reply",
              published: "2024-06-02T10:00:00Z",
              author: { name: "Ada", url: "https://ada.example" },
              content: { text: "Great post!" },
            },
            { "wm-property": "mention-of", url: "https://a.example/mention" },
          ],
        }),
      })
    );

    const mentions = await getWebmentions("https://timothybrits.co.za/blog/x");
    expect(mentions).toHaveLength(4);
    expect(mentions[2]).toEqual({
      type: "reply",
      url: "https://a.example/reply",
      published: "2024-06-02T10:00:00Z",
      authorName: "Ada",
      authorUrl: "https://ada.example",
      content: "Great post!",
    });
  });

  it("drops entries without a usable url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ children: [{ "wm-property": "like-of" }] }),
      })
    );

    expect(await getWebmentions("https://example.com")).toEqual([]);
  });

  it("returns an empty array on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    );

    expect(await getWebmentions("https://example.com")).toEqual([]);
  });

  it("returns an empty array when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error"))
    );

    expect(await getWebmentions("https://example.com")).toEqual([]);
  });

  it("returns an empty array when the payload has no children array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );

    expect(await getWebmentions("https://example.com")).toEqual([]);
  });
});

describe("summarizeWebmentions", () => {
  it("counts likes and reposts and sorts content-bearing replies oldest first", () => {
    const summary = summarizeWebmentions([
      {
        type: "like",
        url: "1",
        published: undefined,
        authorName: undefined,
        authorUrl: undefined,
        content: undefined,
      },
      {
        type: "like",
        url: "2",
        published: undefined,
        authorName: undefined,
        authorUrl: undefined,
        content: undefined,
      },
      {
        type: "repost",
        url: "3",
        published: undefined,
        authorName: undefined,
        authorUrl: undefined,
        content: undefined,
      },
      {
        type: "reply",
        url: "4",
        published: "2024-06-05",
        authorName: "Bo",
        authorUrl: undefined,
        content: "second",
      },
      {
        type: "reply",
        url: "5",
        published: "2024-06-01",
        authorName: "Ada",
        authorUrl: undefined,
        content: "first",
      },
      {
        type: "reply",
        url: "6",
        published: "2024-06-03",
        authorName: "No content",
        authorUrl: undefined,
        content: undefined,
      },
    ]);

    expect(summary.likeCount).toBe(2);
    expect(summary.repostCount).toBe(1);
    expect(summary.replies.map((reply) => reply.content)).toEqual([
      "first",
      "second",
    ]);
  });

  it("returns zero counts and no replies for an empty list", () => {
    expect(summarizeWebmentions([])).toEqual({
      likeCount: 0,
      repostCount: 0,
      replies: [],
    });
  });
});
