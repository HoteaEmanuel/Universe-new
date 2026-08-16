// Two-phase cursor pagination: page 1 (no cursor) returns every "relevant"
// row unpaginated, then fills the rest of the page from "non-relevant" rows.
// Every request that carries a cursor is, by construction, page >= 2 — so it
// skips the relevant phase entirely and paginates through non-relevant rows
// only. This keeps relevant rows from ever being split across a page boundary
// without needing a composite (relevance + id) cursor.
const NON_RELEVANT_CURSOR_PREFIX = "nr:";

interface RelevantFirstPageResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface RelevantFirstPageParams<T extends { id: string }> {
  cursor?: string;
  limit: number;
  fetchRelevant: () => Promise<T[]>;
  fetchNonRelevant: (cursorId: string | undefined, take: number) => Promise<T[]>;
}

export const getRelevantFirstPage = async <T extends { id: string }>({
  cursor,
  limit,
  fetchRelevant,
  fetchNonRelevant,
}: RelevantFirstPageParams<T>): Promise<RelevantFirstPageResult<T>> => {
  if (cursor) {
    const cursorId = cursor.startsWith(NON_RELEVANT_CURSOR_PREFIX)
      ? cursor.slice(NON_RELEVANT_CURSOR_PREFIX.length) || undefined
      : cursor;
    const rows = await fetchNonRelevant(cursorId, limit + 1);
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: page,
      nextCursor: hasMore
        ? `${NON_RELEVANT_CURSOR_PREFIX}${page[page.length - 1].id}`
        : null,
      hasMore,
    };
  }

  const relevant = await fetchRelevant();
  const remaining = limit - relevant.length;

  if (remaining <= 0) {
    const probe = await fetchNonRelevant(undefined, 1);
    return {
      items: relevant,
      nextCursor: probe.length ? NON_RELEVANT_CURSOR_PREFIX : null,
      hasMore: probe.length > 0,
    };
  }

  const nonRelevant = await fetchNonRelevant(undefined, remaining + 1);
  const hasMore = nonRelevant.length > remaining;
  const page = hasMore ? nonRelevant.slice(0, remaining) : nonRelevant;
  return {
    items: [...relevant, ...page],
    nextCursor: hasMore
      ? `${NON_RELEVANT_CURSOR_PREFIX}${page[page.length - 1].id}`
      : null,
    hasMore,
  };
};
