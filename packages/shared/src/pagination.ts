// The `{ items|posts|users|comments|…, nextCursor, hasMore }` shape appears
// ~20 times across the frontend and mobile query layers. `CursorPage<T>` is
// the shape new endpoints should return; `NamedCursorPage<K, T>` exists so
// existing endpoints whose JSON key isn't "items" (posts, users, events,
// notifications, conversations, groups, comments, people, reports, …) can
// still share the nextCursor/hasMore boilerplate without a breaking response
// shape change to the running backend.

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type NamedCursorPage<K extends string, T> = {
  [P in K]: T[];
} & {
  nextCursor: string | null;
  hasMore: boolean;
};

/** Offset-style page with no cursor (used by search endpoints today). */
export type SearchPage<T> = {
  items: T[];
  hasMore: boolean;
};
