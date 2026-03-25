---
title: "Sweat the Small Stuff: remark-smartypants"
description: "How a tiny remark plugin turns dumb punctuation into proper typography — and why it matters."
pubDate: 2026-03-25
---

If you write on the web, you are almost certainly publishing ugly punctuation. Straight quotes instead of curly ones. Two hyphens instead of an em dash. Three dots instead of an ellipsis character. Most people never notice. The ones who do can't unsee it.

[remark-smartypants](https://github.com/silvenon/remark-smartypants) fixes this automatically. It is a remark plugin — part of the unified ecosystem that powers Markdown processing in tools like Astro, Next.js, and Gatsby. Drop it into your remark pipeline and it transforms "dumb" ASCII punctuation into its typographically correct Unicode equivalent.

Here is what it does:

- `"straight quotes"` become "curly quotes"
- `'single quotes'` become 'single quotes'
- `--` becomes an en dash, `---` becomes an em dash
- `...` becomes a proper ellipsis

That is the entire pitch. No configuration required, no decisions to make. It processes your Markdown at build time and outputs the right characters.

### Why bother?

Typography is one of those details that separates "looks fine" from "looks good." Curly quotes and proper dashes are the kind of thing you see in every printed book but almost never on the web. It is a small thing, but small things compound. Good defaults in your build pipeline mean you get better output without thinking about it — which is the best kind of tooling.

### Using it in Astro

In your Astro config, add it to the `remarkPlugins` array:

```js
import remarkSmartypants from "remark-smartypants";

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkSmartypants],
  },
});
```

That is it. Every Markdown file processed by Astro — blog posts, content collections, standalone pages — gets proper typographic punctuation for free.

Under the hood, remark-smartypants uses [retext-smartypants](https://github.com/retextjs/retext-smartypants), which itself is a port of John Gruber's [SmartyPants](https://daringfireball.net/projects/smartypants/) — the same algorithm that has been cleaning up punctuation since 2003. It is battle-tested.

If you care about how your writing looks — and you should — this is one of the easiest wins available.
