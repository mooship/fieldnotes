import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import { defineConfig, fontProviders } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";
import remarkSmartypants from "remark-smartypants";
import {
  EXTERNAL_LINKS_OPTIONS,
  SMARTYPANTS_OPTIONS,
} from "./src/lib/markdown-config.ts";

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
      name: "Geist",
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
  build: {
    inlineStylesheets: "never",
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  markdown: {
    processor: unified({
      remarkPlugins: [[remarkSmartypants, SMARTYPANTS_OPTIONS]],
      rehypePlugins: [[rehypeExternalLinks, EXTERNAL_LINKS_OPTIONS]],
    }),
    shikiConfig: {
      themes: {
        light: "min-light",
        dark: "min-dark",
      },
      defaultColor: false,
    },
  },
  integrations: [sitemap(), pagefind()],
});
