import type { APIRoute, GetStaticPaths } from "astro";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { getBlogPosts, getPostSlug, getSiteUrl } from "../../lib/blog";

const require = createRequire(import.meta.url);

const PAPER = "#f5f1e8";
const INK = "#302e29";
const INK_SOFT = INK;
const RULE = INK;
const SIGNAL = "#17635d";

type OgFonts = { display: Buffer; regular: Buffer; bold: Buffer };

const fonts = {
  promise: undefined as Promise<OgFonts> | undefined,
};

/**
Reads the VT323 and IBM Plex Mono files satori needs (the same faces as the
site), caching the read as a module-level promise so each font is only loaded
from disk once no matter how many OG images are generated during the build.
*/
async function loadFonts(): Promise<OgFonts> {
  if (!fonts.promise) {
    const paths = [
      require.resolve("@fontsource/vt323/files/vt323-latin-400-normal.woff"),
      require.resolve("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff"),
      require.resolve("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff"),
    ];
    fonts.promise = (async () => {
      const [display, regular, bold] = await Promise.all(
        paths.map((p) => readFile(p))
      );
      return { display, regular, bold };
    })();
  }
  return fonts.promise;
}

/**
Generates one static `/og/<slug>.png` route per published post.
*/
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    params: { slug: getPostSlug(post.id) },
    props: { title: post.data.title },
  }));
};

/**
Renders a post's Open Graph image at build time: lays out the card as an SVG
with satori, then rasterizes it to PNG with sharp.
*/
export const GET: APIRoute = async ({ props, site }) => {
  const { title } = props as { title: string };
  const hostname = new URL(getSiteUrl(site)).hostname;
  const { display, regular, bold } = await loadFonts();

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          padding: "80px 90px",
          fontFamily: "IBM Plex Mono",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "18px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      width: "22px",
                      height: "22px",
                      backgroundColor: SIGNAL,
                    },
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: INK,
                      letterSpacing: "0.14em",
                    },
                    children: "TIMOTHY BRITS",
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontFamily: "VT323",
                      fontSize: "96px",
                      fontWeight: 400,
                      lineHeight: 1,
                      color: INK,
                      maxWidth: "100%",
                    },
                    children: title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      width: "90px",
                      height: "8px",
                      backgroundColor: SIGNAL,
                      marginTop: "34px",
                    },
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "18px",
                fontWeight: 700,
                color: INK_SOFT,
                letterSpacing: "0.1em",
                borderTop: `1px solid ${RULE}`,
                paddingTop: "24px",
              },
              children: [
                {
                  type: "div",
                  props: { children: hostname.toUpperCase() },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      width: "14px",
                      height: "14px",
                      backgroundColor: SIGNAL,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "VT323",
          data: display,
          weight: 400,
          style: "normal",
        },
        {
          name: "IBM Plex Mono",
          data: regular,
          weight: 400,
          style: "normal",
        },
        {
          name: "IBM Plex Mono",
          data: bold,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
    },
  });
};
