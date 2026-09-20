export interface GuestbookEntry {
  name: string;
  message: string;
  date: string;
}

export const GUESTBOOK_STORAGE_KEY = "fieldnotes:1999-guestbook";

const MAX_NAME_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 280;
const MAX_ENTRIES = 50;

/**
Reads locally-signed guestbook entries, newest first. Returns an empty array
when nothing has been signed yet or the stored value is malformed.
*/
export function getGuestbookEntries(): GuestbookEntry[] {
  const raw = localStorage.getItem(GUESTBOOK_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GuestbookEntry[]) : [];
  } catch {
    return [];
  }
}

/**
Signs the guestbook with a trimmed name/message, persists it to
`localStorage`, and returns the updated entry list (newest first, capped at
`MAX_ENTRIES`). Throws if name or message is empty after trimming.
*/
export function addGuestbookEntry(
  name: string,
  message: string
): GuestbookEntry[] {
  const trimmedName = name.trim().slice(0, MAX_NAME_LENGTH);
  const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!trimmedName || !trimmedMessage) {
    throw new Error("Name and message are required.");
  }

  const entry: GuestbookEntry = {
    name: trimmedName,
    message: trimmedMessage,
    date: new Date().toISOString(),
  };
  const entries = [entry, ...getGuestbookEntries()].slice(0, MAX_ENTRIES);
  localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(entries));
  return entries;
}
