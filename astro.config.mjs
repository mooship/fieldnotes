import pagefind from "astro-pagefind";
import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import remarkSmartypants from "remark-smartypants";
import { remarkReadingTime } from "./src/lib/remark-reading-time.ts";

export default defineConfig({
  site: "https://timothybrits.co.za",
  trailingSlash: "never",
  output: "static",
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Geist Mono",
      cssVariable: "--font-mono",
    },
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-sans",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      fallbacks: [
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "system-ui",
        "sans-serif",
      ],
    },
  ],
  cacheDir: "./.astro-cache",
  vite: {
    build: {
      assetsInlineLimit: 4096,
    },
  },
  markdown: {
    remarkPlugins: [
      [remarkSmartypants, { dashes: "inverted" }],
      remarkReadingTime,
    ],
    rehypePlugins: [
      [rehypeExternalLinks, { rel: ["noopener", "noreferrer"] }],
    ],
    shikiConfig: {
      themes: {
        light: "min-light",
        dark: "min-dark",
      },
      defaultColor: false,
    },
  },
  integrations: [sitemap(), pagefind()],
  experimental: {
    rustCompiler: true,
  },
});
