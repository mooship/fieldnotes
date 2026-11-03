import { describe, expect, it } from "vitest";
import { getEmailAddress, revealEmailLinks } from "./email";

describe("getEmailAddress", () => {
  it("returns the contact address", () => {
    expect(getEmailAddress()).toBe("timothybrits@icloud.com");
  });
});

describe("revealEmailLinks", () => {
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
});
