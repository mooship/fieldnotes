const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function xmlEscape(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => XML_ENTITIES[ch]);
}
