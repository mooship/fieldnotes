import cloudflare from "@astrojs/cloudflare";
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
  session: false,
  adapter: cloudflare({
    // Prerendered pages (everything except the guestbook API route) build
    // through plain Node rather than a workerd sandbox — og/[slug].png.ts
    // uses satori+sharp, and node:fs for font loading, neither compatible
    // with workerd's build-time restrictions (no native modules).
    prerenderEnvironment: "node",
    // The site doesn't use Astro's image pipeline (astro:assets is only
    // used for Font, not <Image>), so skip provisioning a Cloudflare
    // Images binding the adapter would otherwise enable by default.
    imageService: "passthrough",
  }),
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
  vite: {
    build: {
      // Force every component script to its own external, immutable-cached
      // /_astro/*.js file rather than inlined into the page. A page with any
      // inline `<script type="module">` (no src) makes the ClientRouter
      // inject a `data:application/javascript,` synchronization barrier on
      // every soft navigation, which this site's CSP (script-src has no
      // data:) then blocks. Keeping every script external avoids the
      // barrier entirely instead of relaxing the CSP to allow it.
      assetsInlineLimit: (file) => (file.endsWith(".js") ? false : undefined),
    },
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
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/1999"),
    }),
    pagefind(),
  ],
});
