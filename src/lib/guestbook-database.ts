import type { GuestbookEntry, GuestbookInput } from "./guestbook";
import { MAX_ENTRIES } from "./guestbook";

export interface GuestbookBoundStatement {
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface GuestbookPreparedStatement {
  bind(...values: unknown[]): GuestbookBoundStatement;
}

export interface GuestbookDatabase {
  prepare(query: string): GuestbookPreparedStatement;
}

/**
Reads guestbook entries newest first, capped at `MAX_ENTRIES`. Structural
`GuestbookDatabase` type lets this run against a real D1 binding or a fake in
tests.
*/
export async function listGuestbookEntries(
  database: GuestbookDatabase
): Promise<GuestbookEntry[]> {
  const { results } = await database
    .prepare(
      "SELECT id, name, message, created_at as createdAt FROM guestbook_entries ORDER BY id DESC LIMIT ?"
    )
    .bind(MAX_ENTRIES)
    .all<GuestbookEntry>();
  return results;
}

export async function insertGuestbookEntry(
  database: GuestbookDatabase,
  entry: GuestbookInput
): Promise<void> {
  await database
    .prepare("INSERT INTO guestbook_entries (name, message) VALUES (?, ?)")
    .bind(entry.name, entry.message)
    .run();
}
