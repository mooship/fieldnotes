export interface CommandPaletteItem {
  title: string;
  url: string;
  section: string;
  description?: string;
}

/**
 * Scores an exact substring match, or returns `undefined` when `query`
 * doesn't appear in `text` at all. Matching at a word boundary scores
 * higher, and an earlier match scores higher than a later one.
 */
function scoreSubstringMatch(query: string, text: string): number | undefined {
  const substringIndex = text.indexOf(query);
  if (substringIndex === -1) return undefined;

  const isAtWordBoundary =
    substringIndex === 0 || /[\s/-]/.test(text[substringIndex - 1]);
  return (isAtWordBoundary ? 200 : 100) - substringIndex;
}

/**
 * Scores a fuzzy in-order subsequence match (e.g. "ssg" against "static
 * site generators"), or `undefined` if `query`'s characters don't all
 * appear in `text` in order. Scored by how tightly the matched characters
 * are clustered together.
 */
function scoreFuzzySubsequenceMatch(
  query: string,
  text: string
): number | undefined {
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

  return Math.max(1, 50 - (lastMatch - firstMatch));
}

/**
 * Scores `query` against a title: an exact substring match, falling back to
 * a fuzzy subsequence match for short abbreviation-style queries (e.g. "ssg"
 * for "static site generators").
 */
function scoreTitleMatch(query: string, title: string): number | undefined {
  return (
    scoreSubstringMatch(query, title) ??
    scoreFuzzySubsequenceMatch(query, title)
  );
}

/**
 * Scores `query` against a description: an exact substring match only.
 * Fuzzy subsequence matching is deliberately not used here — against prose
 * as long as a description, a handful of common letters will almost always
 * appear in order somewhere, turning "fuzzy" into "matches everything."
 */
function scoreDescriptionMatch(
  query: string,
  description: string
): number | undefined {
  return scoreSubstringMatch(query, description);
}

interface ScoredItem {
  item: CommandPaletteItem;
  isTitleMatch: boolean;
  score: number;
}

function scoreItem(
  item: CommandPaletteItem,
  query: string
): ScoredItem | undefined {
  const titleScore = scoreTitleMatch(query, item.title.toLowerCase());
  if (titleScore !== undefined) {
    return { item, isTitleMatch: true, score: titleScore };
  }

  const descriptionScore = item.description
    ? scoreDescriptionMatch(query, item.description.toLowerCase())
    : undefined;
  if (descriptionScore !== undefined) {
    return { item, isTitleMatch: false, score: descriptionScore };
  }

  return undefined;
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

  return items
    .map((item) => scoreItem(item, trimmed))
    .filter((entry) => entry !== undefined)
    .toSorted(
      (a, b) =>
        Number(b.isTitleMatch) - Number(a.isTitleMatch) || b.score - a.score
    )
    .slice(0, limit)
    .map((entry) => entry.item);
}
