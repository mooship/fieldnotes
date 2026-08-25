import type { APIContext } from "astro";
import { getSiteUrl } from "../lib/blog";

export function GET(context: APIContext) {
  const site = getSiteUrl(context.site);

  const lines = [
    "# Fieldnotes",
    "",
    "## Pages",
    "",
    `- [Now](${site}/now): What I'm currently working on, reading, and learning.`,
    `- [Uses](${site}/uses): The tools, hardware, and software I use daily.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
