import { describe, expect, it } from "vitest";
import { normalizeGuestbookInput } from "./guestbook";

describe("normalizeGuestbookInput", () => {
  it("trims a valid name/message pair", () => {
    expect(normalizeGuestbookInput("  trace  ", "  great site!!  ")).toEqual({
      name: "trace",
      message: "great site!!",
    });
  });

  it("throws when name is empty after trimming", () => {
    expect(() => normalizeGuestbookInput(" ".repeat(3), "hello")).toThrow();
  });

  it("throws when message is empty after trimming", () => {
    expect(() => normalizeGuestbookInput("trace", " ".repeat(3))).toThrow();
  });

  it("throws when both name and message are empty", () => {
    expect(() => normalizeGuestbookInput("", "")).toThrow();
  });

  it("truncates an overly long name to 40 characters", () => {
    const { name } = normalizeGuestbookInput("n".repeat(100), "hello");
    expect(name).toHaveLength(40);
  });

  it("truncates an overly long message to 280 characters", () => {
    const { message } = normalizeGuestbookInput("trace", "m".repeat(500));
    expect(message).toHaveLength(280);
  });
});
