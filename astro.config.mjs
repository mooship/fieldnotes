import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://timothybrits.co.za",
  trailingSlash: "never",
  output: "static",
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "IBM Plex Mono",
      cssVariable: "--font-mono",
    },
    {
      provider: fontProviders.fontsource(),
      name: "DM Sans",
      cssVariable: "--font-dm-sans",
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
  integrations: [sitemap()],
  experimental: {
    rustCompiler: true,
  },
});
