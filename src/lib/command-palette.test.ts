import { describe, expect, it } from "vitest";
import { filterCommandPaletteItems } from "./command-palette";

const items = [
  { title: "Home", url: "/", section: "Pages" },
  { title: "Blog", url: "/blog", section: "Pages" },
  { title: "Now", url: "/now", section: "Pages" },
  {
    title: "Static site generators compared",
    url: "/blog/static-site-generators",
    section: "Posts",
    description: "A look at Astro, Eleventy, and Hugo.",
  },
  {
    title: "On writing fieldnotes",
    url: "/blog/on-writing-fieldnotes",
    section: "Posts",
    description: "Why this blog exists.",
  },
];

describe("filterCommandPaletteItems", () => {
  it("returns the first `limit` items unchanged when the query is empty", () => {
    expect(filterCommandPaletteItems(items, "", 3)).toEqual(items.slice(0, 3));
  });

  it("returns the first `limit` items unchanged when the query is whitespace", () => {
    expect(filterCommandPaletteItems(items, " ".repeat(3), 3)).toEqual(
      items.slice(0, 3)
    );
  });

  it("excludes items that match neither the title nor the description", () => {
    const results = filterCommandPaletteItems(items, "guestbook");
    expect(results).toEqual([]);
  });

  it("matches a substring that isn't at a word boundary", () => {
    const results = filterCommandPaletteItems(items, "log");
    expect(results.map((item) => item.title)).toContain("Blog");
  });

  it("matches case-insensitively", () => {
    const results = filterCommandPaletteItems(items, "BLOG");
    expect(results.map((item) => item.title)).toContain("Blog");
  });

  it("ranks an exact/prefix title match above a mid-string substring match", () => {
    const results = filterCommandPaletteItems(items, "static");
    expect(results[0].title).toBe("Static site generators compared");
  });

  it("matches on description text when the title doesn't match", () => {
    const results = filterCommandPaletteItems(items, "eleventy");
    expect(results.map((item) => item.title)).toContain(
      "Static site generators compared"
    );
  });

  it("ranks a title match above a description-only match", () => {
    const results = filterCommandPaletteItems(items, "writing fieldnotes");
    expect(results[0].title).toBe("On writing fieldnotes");
  });

  it("does not fuzzy-match scattered characters in a description", () => {
    const scattered = [
      {
        title: "Unrelated post",
        url: "/blog/unrelated-post",
        section: "Posts",
        description: "s words t about a nothing t in i particular c here",
      },
    ];
    expect(filterCommandPaletteItems(scattered, "static")).toEqual([]);
  });

  it("matches out-of-order-free fuzzy subsequences", () => {
    const results = filterCommandPaletteItems(items, "ssg");
    expect(results.map((item) => item.title)).toContain(
      "Static site generators compared"
    );
  });

  it("respects the limit", () => {
    const results = filterCommandPaletteItems(items, "", 2);
    expect(results).toHaveLength(2);
  });
});
