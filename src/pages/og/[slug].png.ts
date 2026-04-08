import type { APIRoute, GetStaticPaths } from "astro";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import sharp from "sharp";
import { getBlogPosts, getPostSlug } from "../../lib/blog";

const require = createRequire(import.meta.url);

const RAINBOW_GRADIENT =
  "linear-gradient(to right, #61bb46, #fdb827, #f5821f, #e03a3e, #963d97, #009ddc)";

let fontData: Buffer | undefined;

async function loadFont(): Promise<Buffer> {
  if (fontData) return fontData;
  const fontPath =
    require.resolve("@fontsource/geist/files/geist-latin-400-normal.woff");
  fontData = await readFile(fontPath);
  return fontData;
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
  const font = await loadFont();

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: "#ffffff",
          padding: "60px 80px",
          fontFamily: "Geist",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                width: "100%",
                height: "6px",
                position: "absolute",
                top: "0",
                left: "0",
                background: RAINBOW_GRADIENT,
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: "56px",
                lineHeight: 1.15,
                color: "#000000",
                letterSpacing: "-0.01em",
                maxWidth: "90%",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: "24px",
                color: "#6e6e73",
                marginTop: "32px",
              },
              children: "timothybrits.co.za",
            },
          },
          {
            type: "div",
            props: {
              style: {
                width: "100%",
                height: "6px",
                position: "absolute",
                bottom: "0",
                left: "0",
                background: RAINBOW_GRADIENT,
              },
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
          data: font,
          weight: 400,
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
