import type { APIContext } from "astro";
import { getSiteUrl } from "../lib/blog";
import { AI_TRAINING_BOTS } from "../lib/robots";

export function GET(context: APIContext) {
  const siteUrl = getSiteUrl(context.site);

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      ...AI_TRAINING_BOTS.map((bot) => `User-agent: ${bot}\nDisallow: /\n`),
      `Sitemap: ${siteUrl}/sitemap-index.xml`,
    ].join("\n"),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
