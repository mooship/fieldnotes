const WEBMENTION_IO_ENDPOINT = "https://webmention.io/api/mentions.jf2";
const FETCH_TIMEOUT_MS = 5000;

export type WebmentionType = "like" | "repost" | "reply" | "mention";

export interface Webmention {
  type: WebmentionType;
  url: string;
  published: string | undefined;
  authorName: string | undefined;
  authorUrl: string | undefined;
  content: string | undefined;
}

const WM_PROPERTY_TYPE: Record<string, WebmentionType> = {
  "like-of": "like",
  "repost-of": "repost",
  "in-reply-to": "reply",
  "mention-of": "mention",
};

function parseMention(raw: unknown): Webmention | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const mention = raw as Record<string, unknown>;
  if (typeof mention.url !== "string") return undefined;

  const property =
    typeof mention["wm-property"] === "string" ? mention["wm-property"] : "";
  const author =
    typeof mention.author === "object" && mention.author !== null
      ? (mention.author as Record<string, unknown>)
      : undefined;
  const content =
    typeof mention.content === "object" && mention.content !== null
      ? (mention.content as Record<string, unknown>)
      : undefined;

  return {
    type: WM_PROPERTY_TYPE[property] ?? "mention",
    url: mention.url,
    published:
      typeof mention.published === "string" ? mention.published : undefined,
    authorName: typeof author?.name === "string" ? author.name : undefined,
    authorUrl: typeof author?.url === "string" ? author.url : undefined,
    content: typeof content?.text === "string" ? content.text : undefined,
  };
}

/**
 * Fetches webmentions targeting `url` from webmention.io's public jf2 feed.
 * Returns an empty array on any failure — a network error, a timeout, a
 * non-2xx response, or the site not (yet) being registered with
 * webmention.io — so a build never fails because a third-party service is
 * unavailable or unconfigured.
 */
export async function getWebmentions(url: string): Promise<Webmention[]> {
  const endpoint = new URL(WEBMENTION_IO_ENDPOINT);
  endpoint.searchParams.set("target", url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) return [];

    const data: unknown = await response.json();
    const children =
      typeof data === "object" && data !== null && "children" in data
        ? (data as { children: unknown }).children
        : undefined;
    if (!Array.isArray(children)) return [];

    return children
      .map((child) => parseMention(child))
      .filter((mention) => mention !== undefined);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export interface WebmentionSummary {
  likeCount: number;
  repostCount: number;
  replies: Webmention[];
}

/**
 * Groups raw webmentions into like/repost counts plus a chronological list
 * of replies with visible content. Mentions and content-less replies are
 * dropped — there's nothing meaningful to show for them.
 */
export function summarizeWebmentions(
  mentions: Webmention[]
): WebmentionSummary {
  return {
    likeCount: mentions.filter((mention) => mention.type === "like").length,
    repostCount: mentions.filter((mention) => mention.type === "repost").length,
    replies: mentions
      .filter((mention) => mention.type === "reply" && mention.content)
      .toSorted((a, b) => (a.published ?? "").localeCompare(b.published ?? "")),
  };
}
