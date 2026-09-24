import { describe, expect, it, vi } from "vitest";
import type { GuestbookDatabase } from "./guestbook-database";
import {
  insertGuestbookEntry,
  listGuestbookEntries,
} from "./guestbook-database";

function createFakeDatabase(all: { results: unknown[] }) {
  const run = vi.fn().mockResolvedValue(undefined);
  const allFunction = vi.fn().mockResolvedValue(all);
  const bind = vi.fn().mockReturnValue({ all: allFunction, run });
  const prepare = vi.fn().mockReturnValue({ bind });
  const database: GuestbookDatabase = { prepare };
  return { database, prepare, bind, allFunction, run };
}

describe("listGuestbookEntries", () => {
  it("selects entries newest-first, capped at MAX_ENTRIES", async () => {
    const results = [{ id: 2, name: "mico", message: "woof", createdAt: "" }];
    const { database, prepare, bind } = createFakeDatabase({ results });

    const entries = await listGuestbookEntries(database);

    expect(entries).toBe(results);
    expect(prepare).toHaveBeenCalledWith(
      expect.stringMatching(/ORDER BY id DESC/)
    );
    expect(bind).toHaveBeenCalledWith(50);
  });
});

describe("insertGuestbookEntry", () => {
  it("inserts the trimmed name and message", async () => {
    const { database, prepare, bind, run } = createFakeDatabase({
      results: [],
    });

    await insertGuestbookEntry(database, { name: "trace", message: "hello" });

    expect(prepare).toHaveBeenCalledWith(
      expect.stringMatching(/INSERT INTO guestbook_entries/)
    );
    expect(bind).toHaveBeenCalledWith("trace", "hello");
    expect(run).toHaveBeenCalled();
  });
});
