import { describe, expect, it, vi } from "vitest";
import { isTurnstileTokenValid } from "./turnstile";

describe("isTurnstileTokenValid", () => {
  it("returns false without calling out when the token is empty", async () => {
    const fetchMock = vi.fn();
    const result = await isTurnstileTokenValid("", "secret", "1.2.3.4", {
      fetch: fetchMock,
    });
    expect(result).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns true when Cloudflare reports success", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ success: true }));
    const result = await isTurnstileTokenValid("token", "secret", "1.2.3.4", {
      fetch: fetchMock,
    });
    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns false when Cloudflare reports failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ success: false }));
    const result = await isTurnstileTokenValid("token", "secret", "1.2.3.4", {
      fetch: fetchMock,
    });
    expect(result).toBe(false);
  });

  it("returns false when the verification request fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 500 }));
    const result = await isTurnstileTokenValid("token", "secret", "1.2.3.4", {
      fetch: fetchMock,
    });
    expect(result).toBe(false);
  });
});
