import type { APIContext } from "astro";

export function GET(context: APIContext) {
  const siteUrl = context.site?.toString().replace(/\/$/, "") ?? "";

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
