import { bindings, defineConfig } from "cf/config";

// The Worker entrypoint and the static assets directory come from
// @astrojs/cloudflare, which hands both to the Cloudflare Vite plugin.
//
// Custom Domains (timothybrits.co.za, www.timothybrits.co.za) are deliberately
// not declared here. The apex has pre-existing DNS records that Cloudflare's
// Custom Domain API refuses to take over automatically, so the domain is
// attached by hand in the dashboard (Workers & Pages, fieldnotes, Settings,
// Domains & Routes).
export default defineConfig({
  worker: {
    name: "fieldnotes",
    compatibilityDate: "2026-09-24",
    compatibilityFlags: ["nodejs_compat", "global_fetch_strictly_public"],
    entrypoint: "@astrojs/cloudflare/entrypoints/server",
    workersDev: false,
    previewUrls: true,
    placement: { mode: "smart" },
    observability: {
      enabled: true,
      headSamplingRate: 1,
      redactQueryString: true,
      logs: {
        enabled: true,
        headSamplingRate: 1,
        invocationLogs: true,
        persist: true,
      },
      traces: {
        enabled: true,
        headSamplingRate: 1,
        persist: true,
      },
      issues: {
        enabled: true,
      },
    },
    assets: {
      htmlHandling: "drop-trailing-slash",
      notFoundHandling: "404-page",
    },
    env: {
      DB: bindings.d1({
        name: "fieldnotes-guestbook",
        id: "730f141e-9d36-4418-8033-8795e3f09aba",
      }),
      // Anonymous guestbook posts are capped at 5 per client IP per 60s window.
      GUESTBOOK_RATE_LIMITER: bindings.rateLimit({
        namespace: "1001",
        simple: { limit: 5, period: 60 },
      }),
      ASSETS: bindings.assets(),
      TURNSTILE_SECRET_KEY: bindings.secret(),
    },
  },
});
