import sitemap from "@astrojs/sitemap";
import playformInline from "@playform/inline";
import compressor from "astro-compressor";
import purgecss from "astro-purgecss";
import { defineConfig } from "astro/config";
import { FontaineTransform } from "fontaine";

const fontaineOptions = {
  fallbacks: ["Arial", "system-ui"],
};

export default defineConfig({
  site: "https://greendegrowth.theredsoil.co.za",
  trailingSlash: "never",
  output: "static",
  build: {
    assetsInlineLimit: 4096,
    cacheDir: "./.astro-cache",
    rollupOptions: {
      output: {
        crossOrigin: "anonymous",
      },
    },
  },
  integrations: [sitemap(), playformInline(), purgecss(), compressor()],
  vite: {
    plugins: [FontaineTransform.vite(fontaineOptions)],
  },
});
