## Built with

- [Astro](https://astro.build) — static output, no client-side framework
- [VT323](https://fontsource.org/fonts/vt323) for headings and window titles, [IBM Plex Mono](https://fontsource.org/fonts/ibm-plex-mono) for reading and code
- [Pagefind](https://pagefind.app) for full-text search — indexed at build time, no server
- [Satori](https://github.com/vercel/satori) and [Sharp](https://sharp.pixelplumbing.com) generate the Open Graph image for every post at build time
- RSS, Atom, and JSON Feed, all rendered from the same post data
- Hosted on Cloudflare Workers

## Design

A small desktop environment: overlapping windows, striped title bars, square corners and hard offset shadows. The Oat & Petrol palette pairs a warm oat desktop with pale window surfaces, charcoal ink and a single petrol accent. No gradients, glass, boot screens or decorative animation.

The menu bar's **Skip the OS** link switches to a conventional reading view. That preference is stored locally in your browser, not sent to a server. On phones, windows stack in a simple vertical flow. Without JavaScript, the site defaults to the conventional view.

## Performance & privacy

No tracking scripts beyond [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/), which is cookieless and doesn't fingerprint. Fonts and search assets are served from this site. The desktop has no client-side framework.

## Source

The whole site is open source: [github.com/mooship/fieldnotes](https://github.com/mooship/fieldnotes), MIT licensed. If something looks broken, that repo is where to say so.

## Before this

An earlier experiment takes the nostalgia a little further. [Go back to 1999 →](/1999)
