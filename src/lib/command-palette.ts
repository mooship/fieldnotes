export interface CommandPaletteItem {
  title: string;
  url: string;
  section: string;
  description?: string;
}

const TITLE_WEIGHT = 1000;
const DESCRIPTION_WEIGHT = 1;

/**
 * Scores how well `query` matches `text`, or returns `undefined` when it
 * doesn't match at all. An exact substring match scores highest (more so at
 * a word boundary). When `canFuzzyMatch` is set, a query with no substring
 * match falls back to a fuzzy in-order subsequence match scored by how
 * tightly the matched characters are clustered — reserved for short titles,
 * since running it against prose (a description) turns any handful of
 * common letters into a spurious match.
 */
function scoreMatch(
  query: string,
  text: string,
  canFuzzyMatch: boolean
): number | undefined {
  const substringIndex = text.indexOf(query);
  if (substringIndex !== -1) {
    const isAtWordBoundary =
      substringIndex === 0 || /[\s/-]/.test(text[substringIndex - 1]);
    return (isAtWordBoundary ? 200 : 100) - substringIndex;
  }
  if (!canFuzzyMatch) return undefined;

  let searchFrom = 0;
  let firstMatch = -1;
  let lastMatch = -1;
  for (const character of query) {
    const found = text.indexOf(character, searchFrom);
    if (found === -1) return undefined;
    if (firstMatch === -1) firstMatch = found;
    lastMatch = found;
    searchFrom = found + 1;
  }

  const spread = lastMatch - firstMatch;
  return Math.max(1, 50 - spread);
}

/**
 * Filters and ranks `items` by how well `query` matches their title or
 * description, title matches always outranking description-only matches. An
 * empty (or whitespace-only) query short-circuits to the first `limit` items
 * in their given order, so the palette has a sensible default listing before
 * the visitor types anything.
 */
export function filterCommandPaletteItems(
  items: CommandPaletteItem[],
  query: string,
  limit = 8
): CommandPaletteItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items.slice(0, limit);

  const scored = items
    .map((item) => {
      const titleScore = scoreMatch(trimmed, item.title.toLowerCase(), true);
      const descriptionScore = item.description
        ? scoreMatch(trimmed, item.description.toLowerCase(), false)
        : undefined;

      let score: number | undefined;
      if (titleScore !== undefined) {
        score = titleScore * TITLE_WEIGHT;
      } else if (descriptionScore !== undefined) {
        score = descriptionScore * DESCRIPTION_WEIGHT;
      }

      return score === undefined ? undefined : { item, score };
    })
    .filter((entry) => entry !== undefined);

  return scored
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}
