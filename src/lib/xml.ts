const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function xmlEscape(string_: string): string {
  return string_.replaceAll(/[&<>"']/g, (ch) => XML_ENTITIES[ch]);
}
