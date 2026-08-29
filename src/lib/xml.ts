const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/** Escapes `&`, `<`, `>`, `"`, and `'` for safe interpolation into XML text or attributes. */
export function xmlEscape(string_: string): string {
  return string_.replaceAll(/[&<>"']/g, (ch) => XML_ENTITIES[ch]);
}
