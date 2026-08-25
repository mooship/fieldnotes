import type { APIContext } from "astro";
import { getSiteUrl } from "../lib/blog";

export function GET(context: APIContext) {
  const siteUrl = getSiteUrl(context.site);

  const aiTrainingBots = [
    "GPTBot",
    "ChatGPT-User",
    "CCBot",
    "Google-Extended",
    "anthropic-ai",
    "ClaudeBot",
    "Claude-Web",
    "Bytespider",
    "Diffbot",
    "FacebookBot",
    "Applebot-Extended",
    "PerplexityBot",
    "cohere-ai",
    "Omgilibot",
    "Timpibot",
    "ImagesiftBot",
    "Amazonbot",
    "YouBot",
    "Meta-ExternalAgent",
  ];

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "",
      ...aiTrainingBots.flatMap((bot) => [
        `User-agent: ${bot}`,
        "Disallow: /",
        "",
      ]),
      `Sitemap: ${siteUrl}/sitemap-index.xml`,
    ].join("\n"),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
