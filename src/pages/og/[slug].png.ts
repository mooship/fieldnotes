import type { APIRoute, GetStaticPaths } from "astro";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { getBlogPosts, getPostSlug } from "../../lib/blog";

const require = createRequire(import.meta.url);

const PAPER = "#f5efe1";
const INK = "#1f1a10";
const INK_SOFT = "#6b5d47";
const RULE = "#c9bfa8";

let fontsPromise: Promise<{ regular: Buffer; italic: Buffer }> | undefined;

async function loadFonts(): Promise<{ regular: Buffer; italic: Buffer }> {
  if (!fontsPromise) {
    const regularPath =
      require.resolve("@fontsource/fraunces/files/fraunces-latin-700-normal.woff");
    const italicPath =
      require.resolve("@fontsource/fraunces/files/fraunces-latin-400-italic.woff");
    fontsPromise = Promise.all([
      readFile(regularPath),
      readFile(italicPath),
    ]).then(([regular, italic]) => ({ regular, italic }));
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

export const GET: APIRoute = async ({ props }) => {
  const { title } = props as { title: string };
  const { regular, italic } = await loadFonts();

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
          padding: "70px 90px",
          fontFamily: "Fraunces",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: "22px",
                fontStyle: "italic",
                color: INK_SOFT,
                letterSpacing: "0.02em",
              },
              children: "Timothy Brits — fieldnotes",
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
                      fontSize: "60px",
                      fontWeight: 700,
                      lineHeight: 1.12,
                      color: INK,
                      letterSpacing: "-0.015em",
                      maxWidth: "95%",
                    },
                    children: title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      width: "60px",
                      height: "2px",
                      backgroundColor: INK_SOFT,
                      marginTop: "28px",
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
                fontSize: "20px",
                fontStyle: "italic",
                color: INK_SOFT,
                borderTop: `1px solid ${RULE}`,
                paddingTop: "22px",
              },
              children: [
                {
                  type: "div",
                  props: { children: "timothybrits.co.za" },
                },
                {
                  type: "div",
                  props: {
                    style: { fontSize: "28px" },
                    children: "❦",
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
          name: "Fraunces",
          data: regular,
          weight: 700,
          style: "normal",
        },
        {
          name: "Fraunces",
          data: italic,
          weight: 400,
          style: "italic",
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
