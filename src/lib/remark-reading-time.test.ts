import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { remarkReadingTime } from "./remark-reading-time";

type FileData = { astro?: { frontmatter?: { readingTime?: string } } };
type Plugin = (tree: object, file: { data: FileData }) => void;

function processMarkdown(markdown: string) {
  const tree = unified().use(remarkParse).parse(markdown);
  const file = { data: {} as FileData };
  (remarkReadingTime() as Plugin)(tree, file);
  return file.data?.astro?.frontmatter?.readingTime;
}

describe("remarkReadingTime", () => {
  it("injects a reading time string into frontmatter", () => {
    const readingTime = processMarkdown("Hello world.");
    expect(readingTime).toBeTypeOf("string");
    expect(readingTime).toMatch(/min read/);
  });

  it("produces a longer time estimate for a long piece of content", () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}`).join(" ");
    const readingTime = processMarkdown(words);
    expect(readingTime).toMatch(/\d+ min read/);
  });

  it("handles empty content without throwing", () => {
    const readingTime = processMarkdown("");
    expect(readingTime).toBeTypeOf("string");
  });
});
