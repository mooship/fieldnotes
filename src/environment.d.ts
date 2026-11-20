/// <reference types="../.astro/types.d.ts" />

// The Cloudflare Vite plugin writes .cloudflare/types/index.d.ts without the
// runtime types (`types.includeRuntime: false` in astro.config.mjs), so its
// ambient globals (Response, Element, etc. from @cloudflare/workers-types)
// don't collide with the DOM lib types that client-side <script> blocks need.
// That means the `cloudflare:workers` module has no type declaration of its
// own, so it's declared minimally here instead, against the Env interface
// generated from cloudflare.config.ts, secrets included.
declare module "cloudflare:workers" {
  // eslint-disable-next-line unicorn/name-replacements -- `env` is the fixed export name of the real cloudflare:workers module, not our naming to pick
  export const env: Env;
}
