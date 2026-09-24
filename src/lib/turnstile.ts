const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifier {
  fetch: typeof fetch;
}

/**
Verifies a Turnstile response token against Cloudflare's siteverify
endpoint. Returns false (without making a request) for an empty token, and
false for any non-2xx response or a `{ success: false }` result.
*/
export async function isTurnstileTokenValid(
  token: string,
  secret: string,
  remoteIp: string,
  verifier?: TurnstileVerifier
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const verifierFetch = verifier?.fetch ?? fetch;
  const response = await verifierFetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { success?: boolean };
  return data.success === true;
}
