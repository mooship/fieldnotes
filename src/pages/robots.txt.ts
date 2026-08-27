import type { APIContext } from "astro";
import { getSiteUrl } from "../lib/blog";

export function GET(context: APIContext) {
  const siteUrl = getSiteUrl(context.site);

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      `Sitemap: ${siteUrl}/sitemap-index.xml`,
      "",
      "# if you're reading this file by hand, hello.",
      "# the rest of the site is more interesting, I promise.",
    ].join("\n"),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
