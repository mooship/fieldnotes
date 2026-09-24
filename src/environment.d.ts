/// <reference types="../.astro/types.d.ts" />

// `wrangler types` runs with --include-runtime=false so its ambient globals
// (Response, Element, etc. from @cloudflare/workers-types) don't collide with
// the DOM lib types that client-side <script> blocks need. That means the
// `cloudflare:workers` module has no type declaration of its own, so it's
// declared minimally here instead, against the Env interface `wrangler types`
// still generates in worker-configuration.d.ts.
declare module "cloudflare:workers" {
  // eslint-disable-next-line unicorn/name-replacements -- `env` is the fixed export name of the real cloudflare:workers module, not our naming to pick
  export const env: Env;
}
