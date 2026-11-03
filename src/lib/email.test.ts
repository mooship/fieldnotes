import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailAddress, revealEmailLinks } from "./email";

describe("getEmailAddress", () => {
  it("returns the contact address", () => {
    expect(getEmailAddress()).toBe("timothybrits@icloud.com");
  });
});

describe("revealEmailLinks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("sets a mailto href on every data-email link", () => {
    document.body.innerHTML = `
      <a id="one" href="/work#contact" data-email>Email</a>
      <a id="two" href="/work#contact" data-email>Email</a>
    `;

    revealEmailLinks(document);

    expect(document.querySelector("#one")?.getAttribute("href")).toBe(
      "mailto:timothybrits@icloud.com"
    );
    expect(document.querySelector("#two")?.getAttribute("href")).toBe(
      "mailto:timothybrits@icloud.com"
    );
  });

  it("keeps the link text unless data-email-text is set", () => {
    document.body.innerHTML = `<a href="/work#contact" data-email>Email</a>`;

    revealEmailLinks(document);

    expect(document.querySelector("a")?.textContent).toBe("Email");
  });

  it("replaces the link text with the address when data-email-text is set", () => {
    document.body.innerHTML = `<a href="/work#contact" data-email data-email-text>Email me (needs JavaScript)</a>`;

    revealEmailLinks(document);

    expect(document.querySelector("a")?.textContent).toBe(
      "timothybrits@icloud.com"
    );
  });

  it("leaves other links alone", () => {
    document.body.innerHTML = `<a href="/blog">Writing</a>`;

    revealEmailLinks(document);

    expect(document.querySelector("a")?.getAttribute("href")).toBe("/blog");
  });

  it("reveals copy buttons, copies the address, announces status, and resets the label", async () => {
    vi.useFakeTimers();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();

    document.body.innerHTML = `
      <button type="button" data-copy-email hidden>Copy</button>
      <span data-desktop-status></span>
    `;

    revealEmailLinks(document);

    const button = document.querySelector<HTMLButtonElement>(
      "button[data-copy-email]"
    )!;
    const status = document.querySelector<HTMLElement>(
      "[data-desktop-status]"
    )!;

    expect(button.hidden).toBe(false);

    button.click();
    await vi.waitFor(() => {
      expect(button.textContent).toBe("Copied!");
    });

    expect(writeText).toHaveBeenCalledWith("timothybrits@icloud.com");
    expect(status.textContent).toBe("Copied email address");

    vi.advanceTimersByTime(2000);
    expect(button.textContent).toBe("Copy");
  });

  it("shows Failed when copying rejects and works without a status element", async () => {
    vi.useFakeTimers();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied")
    );

    document.body.innerHTML = `<button type="button" data-copy-email hidden>Copy</button>`;

    revealEmailLinks(document);

    const button = document.querySelector<HTMLButtonElement>(
      "button[data-copy-email]"
    )!;

    button.click();
    await vi.waitFor(() => {
      expect(button.textContent).toBe("Failed");
    });

    vi.advanceTimersByTime(2000);
    expect(button.textContent).toBe("Copy");
  });
});
