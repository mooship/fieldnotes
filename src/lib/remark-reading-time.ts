import type { Root } from "mdast";
import { toString } from "mdast-util-to-string";
import getReadingTime from "reading-time";
import type { VFile } from "vfile";

export function remarkReadingTime() {
  return function (tree: Root, file: VFile) {
    const text = toString(tree);
    const readingTime = getReadingTime(text);
    const data = file.data as {
      astro?: { frontmatter?: Record<string, unknown> };
    };
    data.astro ??= {};
    data.astro.frontmatter ??= {};
    data.astro.frontmatter.readingTime = readingTime.text;
  };
}
