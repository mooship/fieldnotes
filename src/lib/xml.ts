const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function xmlEscape(str: string): string {
  return str.replaceAll(/[&<>"']/g, (ch) => XML_ENTITIES[ch]);
}
