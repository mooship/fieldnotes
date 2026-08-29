/**
 * Increments and persists a per-`sessionStorage`-key counter, returning the
 * new count. Used to vary easter-egg messages (e.g. the 404 page, the
 * wordmark click) across repeat interactions within a browser session.
 */
export function incrementSessionCount(key: string): number {
  const count = Number(sessionStorage.getItem(key) ?? "0") + 1;
  sessionStorage.setItem(key, String(count));
  return count;
}
