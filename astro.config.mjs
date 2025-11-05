import sitemap from "@astrojs/sitemap";
import playformInline from "@playform/inline";
import purgecss from "astro-purgecss";
import { defineConfig } from "astro/config";
import { FontaineTransform } from "fontaine";

const fontaineOptions = {
  fallbacks: [
    "Work Sans Variable",
    "Work Sans",
    "Inter Variable",
    "Inter",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "system-ui",
    "sans-serif",
    "Segoe UI",
    "SFMono-Regular",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
};

export default defineConfig({
  site: "https://codeandhammer.theredsoil.co.za",
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
  integrations: [playformInline(), sitemap(), purgecss()],
  vite: {
    plugins: [FontaineTransform.vite(fontaineOptions)],
  },
});
