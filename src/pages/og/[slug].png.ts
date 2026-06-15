import type { APIRoute, GetStaticPaths } from "astro";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { getBlogPosts, getPostSlug, getSiteUrl } from "../../lib/blog";

const require = createRequire(import.meta.url);

const PAPER = "#ffffff";
const INK = "#0a0a0a";
const INK_SOFT = "#6b6b6b";
const RULE = "#d8d8d8";
const SIGNAL = "#e2231a";

let fontsPromise: Promise<{ regular: Buffer; bold: Buffer }> | undefined;

async function loadFonts(): Promise<{ regular: Buffer; bold: Buffer }> {
  if (!fontsPromise) {
    const regularPath =
      require.resolve("@fontsource/geist/files/geist-latin-400-normal.woff");
    const boldPath =
      require.resolve("@fontsource/geist/files/geist-latin-700-normal.woff");
    fontsPromise = Promise.all([
      readFile(regularPath),
      readFile(boldPath),
    ]).then(([regular, bold]) => ({ regular, bold }));
  }
  return fontsPromise;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    params: { slug: getPostSlug(post.id) },
    props: { title: post.data.title },
  }));
};

export const GET: APIRoute = async ({ props, site }) => {
  const { title } = props as { title: string };
  const hostname = new URL(getSiteUrl(site)).hostname;
  const { regular, bold } = await loadFonts();

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
          fontFamily: "Geist",
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
                    children: "TIMOTHY BRITS — FIELDNOTES",
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
                      fontSize: "76px",
                      fontWeight: 700,
                      lineHeight: 1,
                      color: INK,
                      letterSpacing: "-0.035em",
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
          name: "Geist",
          data: regular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Geist",
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
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
