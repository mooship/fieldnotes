export function incrementSessionCount(key: string): number {
  const count = Number(sessionStorage.getItem(key) ?? "0") + 1;
  sessionStorage.setItem(key, String(count));
  return count;
}
