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

// `wrangler types` only knows about secrets (TURNSTILE_SECRET_KEY isn't in
// wrangler.jsonc, since secrets never are) if a local `.dev.vars` happens to
// declare them — which it does locally, but `.dev.vars` is gitignored, so CI
// has none and the generated Env interface silently omits it there. Declared
// explicitly here so the type holds regardless of `.dev.vars`.
// eslint-disable-next-line unicorn/name-replacements -- `Env` is the fixed interface name `wrangler types` generates, not our naming to pick
interface Env {
  TURNSTILE_SECRET_KEY: string;
}
