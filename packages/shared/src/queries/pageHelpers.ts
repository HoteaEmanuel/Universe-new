// Every cursor-paginated list in this codebase follows the same
// { hasMore, nextCursor } shape (see ../pagination.ts). This is the
// `initialPageParam`/`getNextPageParam` pair every infiniteQueryOptions()
// call repeats — one implementation instead of one per query factory.
export const cursorPagination = <T extends { hasMore: boolean; nextCursor: string | null }>() => ({
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage: T) =>
    lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
});
