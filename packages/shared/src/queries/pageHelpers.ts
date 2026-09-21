// Every cursor-paginated list in this codebase follows the same
// { hasMore, nextCursor } shape (see ../pagination.ts). This is the
// `initialPageParam`/`getNextPageParam` pair every infiniteQueryOptions()
// call repeats — one implementation instead of one per query factory.
export const cursorPagination = <T extends { hasMore: boolean; nextCursor: string | null }>() => ({
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage: T) =>
    lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
});

// For the offset-paginated `SearchPage<T>` shape (`{ items, hasMore }`, no
// cursor) - the next offset is the running total of items seen so far.
export const offsetPagination = <T extends { hasMore: boolean; items: unknown[] }>() => ({
  initialPageParam: 0,
  getNextPageParam: (lastPage: T, allPages: T[]) =>
    lastPage.hasMore ? allPages.reduce((sum, page) => sum + page.items.length, 0) : undefined,
});
