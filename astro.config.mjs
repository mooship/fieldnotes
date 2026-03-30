import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";
import remarkSmartypants from "remark-smartypants";
import { remarkReadingTime } from "./src/lib/remark-reading-time.ts";

export default defineConfig({
  site: "https://timothybrits.co.za",
  trailingSlash: "never",
  output: "static",
  fonts: [
    {
      provider: fontProviders.bunny(),
      name: "EB Garamond",
      cssVariable: "--font-serif",
    },
    {
      provider: fontProviders.bunny(),
      name: "Geist Mono",
      cssVariable: "--font-mono",
    },
    {
      provider: fontProviders.bunny(),
      name: "Geist Sans",
      cssVariable: "--font-sans",
    },
  ],
  cacheDir: "./.astro-cache",
  vite: {
    build: {
      assetsInlineLimit: 4096,
    },
  },
  markdown: {
    remarkPlugins: [remarkSmartypants, remarkReadingTime],
    shikiConfig: {
      themes: {
        light: "min-light",
        dark: "min-dark",
      },
    },
  },
  integrations: [sitemap()],
  experimental: {
    rustCompiler: true,
  },
});
