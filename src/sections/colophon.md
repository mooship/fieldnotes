## Built with

- [Astro](https://astro.build) — static output, no client-side framework
- [Geist](https://vercel.com/font) for everything, [Geist Mono](https://vercel.com/font) for code
- [Pagefind](https://pagefind.app) for full-text search — indexed at build time, no server
- [Satori](https://github.com/vercel/satori) and [Sharp](https://sharp.pixelplumbing.com) generate the Open Graph image for every post at build time
- RSS, Atom, and JSON Feed, all rendered from the same post data
- Hosted on Cloudflare Pages

## Design

Swiss / International Typographic style: pure black-on-white, one hot signal-red accent, sharp corners, hairline rules, a flush-left ragged-right grid. No shadows, no gradients, no italics. Dark mode is CSS-only via `prefers-color-scheme` — there's no toggle, no stored preference, no flash of the wrong theme.

## Webmentions

Post pages listen for [Webmention](https://indieweb.org/Webmention), an open W3C standard for cross-site replies: if you write about a post on your own site and link to it, that shows up under the post here, without any comment system, account, or tracking. Likes and reposts from IndieWeb-aware readers work the same way.

## Performance & privacy

No tracking scripts beyond [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/), which is cookieless and doesn't fingerprint. The carbon badge in the footer of every page is computed entirely client-side from the Performance API using the [Sustainable Web Design Model](https://sustainablewebdesign.org) — nothing is sent anywhere to produce it.

## Source

The whole site is open source: [github.com/mooship/fieldnotes](https://github.com/mooship/fieldnotes), MIT licensed. If something looks broken, that repo is where to say so.
