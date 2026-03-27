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
      provider: fontProviders.fontsource(),
      name: "EB Garamond",
      cssVariable: "--font-serif",
    },
    {
      provider: fontProviders.fontsource(),
      name: "Geist Mono",
      cssVariable: "--font-mono",
    },
    {
      provider: fontProviders.fontsource(),
      name: "Geist Sans",
      cssVariable: "--font-sans",
    },
  ],
  build: {
    assetsInlineLimit: 4096,
    cacheDir: "./.astro-cache",
    rollupOptions: {
      output: {
        crossOrigin: "anonymous",
      },
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
