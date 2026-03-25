import { describe, expect, it } from "vitest";
import { xmlEscape } from "./xml";

describe("xmlEscape", () => {
  it("escapes ampersands", () => {
    expect(xmlEscape("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than signs", () => {
    expect(xmlEscape("<tag>")).toBe("&lt;tag&gt;");
  });

  it("escapes greater-than signs", () => {
    expect(xmlEscape("a > b")).toBe("a &gt; b");
  });

  it("escapes double quotes", () => {
    expect(xmlEscape('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("escapes single quotes", () => {
    expect(xmlEscape("it's")).toBe("it&apos;s");
  });

  it("escapes all special characters in a mixed string", () => {
    expect(xmlEscape('<a href="link">&</a>')).toBe(
      "&lt;a href=&quot;link&quot;&gt;&amp;&lt;/a&gt;"
    );
  });

  it("leaves plain strings unchanged", () => {
    expect(xmlEscape("hello world")).toBe("hello world");
  });
});
