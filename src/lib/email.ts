const EMAIL_USER = "hello";
const EMAIL_DOMAIN = "timothybrits.co.za";
const RESET_DELAY_MS = 2000;

/**
Builds the contact address at runtime from two parts, so the literal address
never appears in the page source, the markdown or the HTML that plain
scrapers read.
*/
export function getEmailAddress(): string {
  return `${EMAIL_USER}@${EMAIL_DOMAIN}`;
}

/**
Fills in every `a[data-email]` under `root` with a `mailto:` link and wires
every `button[data-copy-email]` to copy the address to the clipboard. Links
that also carry `data-email-text` show the address as their text. Without
JavaScript the link keeps its fallback href and spelled-out text and the copy
button stays hidden, so the usable address is never in the served HTML.
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

  for (const button of root.querySelectorAll<HTMLButtonElement>(
    "button[data-copy-email]"
  )) {
    button.hidden = false;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener("click", async () => {
      clearTimeout(resetTimer);
      let label = "Copied!";
      let announcement = "Copied email address";
      try {
        await navigator.clipboard.writeText(address);
      } catch {
        label = "Failed";
        announcement = "Failed to copy email address";
      }
      button.textContent = label;
      const status = root.querySelector<HTMLElement>("[data-desktop-status]");
      if (status) {
        status.textContent = announcement;
      }
      resetTimer = setTimeout(() => {
        button.textContent = "Copy";
      }, RESET_DELAY_MS);
    });
  }
}
