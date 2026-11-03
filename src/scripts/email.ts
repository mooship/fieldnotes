import { revealEmailLinks } from "../lib/email";

document.addEventListener("astro:page-load", () => {
  revealEmailLinks(document);
});
