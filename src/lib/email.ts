const EMAIL_USER = "timothybrits";
const EMAIL_DOMAIN = "icloud.com";

/**
Builds the contact address at runtime from two parts, so the literal address
never appears in the page source, the markdown or the HTML that plain
scrapers read.
*/
export function getEmailAddress(): string {
  return `${EMAIL_USER}@${EMAIL_DOMAIN}`;
}

/**
Fills in every `a[data-email]` under `root` with a `mailto:` link. Links that
also carry `data-email-text` show the address as their text. Without
JavaScript the link keeps its fallback href and text, so the address is never
in the served HTML.
*/
export function revealEmailLinks(root: ParentNode): void {
  const address = getEmailAddress();
  for (const link of root.querySelectorAll<HTMLAnchorElement>(
    "a[data-email]"
  )) {
    link.href = `mailto:${address}`;
    if (link.dataset.emailText !== undefined) {
      link.textContent = address;
    }
  }
}
