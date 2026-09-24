export interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  createdAt: string;
}

export type GuestbookInput = Pick<GuestbookEntry, "name" | "message">;

export const MAX_NAME_LENGTH = 40;
export const MAX_MESSAGE_LENGTH = 280;
export const MAX_ENTRIES = 50;

/**
Trims a raw name/message pair and caps each to its max length. Throws when
either is empty after trimming.
*/
export function normalizeGuestbookInput(
  name: string,
  message: string
): GuestbookInput {
  const trimmedName = name.trim().slice(0, MAX_NAME_LENGTH);
  const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!trimmedName || !trimmedMessage) {
    throw new Error("Name and message are required.");
  }

  return { name: trimmedName, message: trimmedMessage };
}
