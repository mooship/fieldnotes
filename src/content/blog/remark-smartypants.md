---
title: "Sweat the Small Stuff: remark-smartypants"
description: "How a tiny remark plugin turns dumb punctuation into proper typography -- and why it matters."
pubDate: 2026-03-25
---

If you write on the web, you are almost certainly publishing ugly punctuation. Straight quotes instead of curly ones. Two hyphens instead of an em dash. Three dots instead of an ellipsis character. Most people never notice. The ones who do can't unsee it.

[remark-smartypants](https://github.com/silvenon/remark-smartypants) fixes this automatically. It is a remark plugin -- part of the unified ecosystem that powers Markdown processing in tools like Astro, Next.js, and Gatsby. Drop it into your remark pipeline and it transforms "dumb" ASCII punctuation into its typographically correct Unicode equivalent.

Here's what it does:

- `"straight quotes"` become "curly quotes"
- `'single quotes'` become 'single quotes'
- `--` becomes an em dash, `---` becomes an en dash
- `...` becomes a proper ellipsis

That's the entire pitch. No configuration, no decisions. It processes your Markdown at build time and outputs the right characters.

## Why bother?

Typography is one of those details that separates "looks fine" from "looks good." Curly quotes and proper dashes show up in every printed book but almost never on the web. It's a small thing. But small things compound -- good defaults in your build pipeline mean better output without thinking about it.

## Using it in Astro

In your Astro config, add it to the `remarkPlugins` array:

```js
import remarkSmartypants from "remark-smartypants";

export default defineConfig({
  markdown: {
    remarkPlugins: [[remarkSmartypants, { dashes: "inverted" }]],
  },
});
```

That's it. Every Markdown file Astro processes -- blog posts, content collections, standalone pages -- gets proper typographic punctuation for free.

Under the hood, remark-smartypants uses [retext-smartypants](https://github.com/retextjs/retext-smartypants), which itself is a port of John Gruber's [SmartyPants](https://daringfireball.net/projects/smartypants/) -- the same algorithm that's been cleaning up punctuation since 2003. It's battle-tested.

One of the lowest-effort, highest-impact things you can add to a Markdown pipeline.
