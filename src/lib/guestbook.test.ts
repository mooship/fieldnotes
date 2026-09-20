import { beforeEach, describe, expect, it } from "vitest";
import {
  addGuestbookEntry,
  getGuestbookEntries,
  GUESTBOOK_STORAGE_KEY,
} from "./guestbook";

beforeEach(() => {
  localStorage.clear();
});

describe("getGuestbookEntries", () => {
  it("returns an empty array when nothing has been signed", () => {
    expect(getGuestbookEntries()).toEqual([]);
  });

  it("returns an empty array when storage holds malformed JSON", () => {
    localStorage.setItem(GUESTBOOK_STORAGE_KEY, "{not json");
    expect(getGuestbookEntries()).toEqual([]);
  });

  it("returns an empty array when storage holds a non-array value", () => {
    localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify({ hi: true }));
    expect(getGuestbookEntries()).toEqual([]);
  });
});

describe("addGuestbookEntry", () => {
  it("stores a trimmed entry and returns it newest-first", () => {
    const entries = addGuestbookEntry("  trace  ", "  great site!!  ");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      name: "trace",
      message: "great site!!",
    });
    expect(entries[0].date).toEqual(expect.any(String));
  });

  it("prepends new entries so the latest signature is first", () => {
    addGuestbookEntry("trace", "first");
    addGuestbookEntry("mico", "second");
    const entries = getGuestbookEntries();
    expect(entries.map((entry) => entry.name)).toEqual(["mico", "trace"]);
  });

  it("persists entries across separate calls via localStorage", () => {
    addGuestbookEntry("trace", "hello");
    expect(getGuestbookEntries()).toHaveLength(1);
  });

  it("throws when name is empty after trimming", () => {
    expect(() => addGuestbookEntry(" ".repeat(3), "hello")).toThrow();
  });

  it("throws when message is empty after trimming", () => {
    expect(() => addGuestbookEntry("trace", " ".repeat(3))).toThrow();
  });

  it("truncates overly long names and messages", () => {
    const entries = addGuestbookEntry("n".repeat(100), "m".repeat(500));
    expect(entries[0].name).toHaveLength(40);
    expect(entries[0].message).toHaveLength(280);
  });

  it("caps stored entries at 50, dropping the oldest", () => {
    for (let index = 0; index < 55; index++) {
      addGuestbookEntry(`visitor${index}`, `message ${index}`);
    }
    const entries = getGuestbookEntries();
    expect(entries).toHaveLength(50);
    expect(entries[0].name).toBe("visitor54");
    expect(entries.at(-1)?.name).toBe("visitor5");
  });
});
