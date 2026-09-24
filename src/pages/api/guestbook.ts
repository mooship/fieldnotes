import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { normalizeGuestbookInput } from "../../lib/guestbook";
import {
  insertGuestbookEntry,
  listGuestbookEntries,
} from "../../lib/guestbook-database";
import { isTurnstileTokenValid } from "../../lib/turnstile";

// eslint-disable-next-line unicorn/consistent-boolean-name -- `prerender` is Astro's own required export name for opting a route out of static rendering
export const prerender = false;

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export const GET: APIRoute = async () => {
  const entries = await listGuestbookEntries(env.DB);
  return Response.json(entries);
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const { success } = await env.GUESTBOOK_RATE_LIMITER.limit({
    key: clientAddress,
  });
  if (!success) {
    return jsonError("Too many entries — try again in a minute.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const { name, message, turnstileToken } = body as {
    name?: unknown;
    message?: unknown;
    turnstileToken?: unknown;
  };
  if (typeof name !== "string" || typeof message !== "string") {
    return jsonError("Name and message are required.", 400);
  }

  const isHuman = await isTurnstileTokenValid(
    typeof turnstileToken === "string" ? turnstileToken : "",
    env.TURNSTILE_SECRET_KEY,
    clientAddress
  );
  if (!isHuman) {
    return jsonError("Verification failed — please try again.", 400);
  }

  let normalized;
  try {
    normalized = normalizeGuestbookInput(name, message);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Invalid input.";
    return jsonError(reason, 400);
  }

  await insertGuestbookEntry(env.DB, normalized);
  const entries = await listGuestbookEntries(env.DB);
  return Response.json(entries, { status: 201 });
};
