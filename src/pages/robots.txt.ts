import type { APIContext } from "astro";
import { getSiteUrl } from "../lib/blog";

export function GET(context: APIContext) {
  const siteUrl = context.site ? getSiteUrl(context.site) : "";

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${siteUrl}/sitemap-index.xml`,
    ].join("\n"),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
