// An opaque (updatedAt, id) keyset cursor, shared by every list paginated by
// "most recently updated" order. `id` is the tie-breaker for stable ordering
// when `updatedAt` collides.
export const encodeCursor = (updatedAt: Date, id: string) =>
  Buffer.from(`${updatedAt.toISOString()}|${id}`).toString("base64url");

export const decodeCursor = (cursor: string): { updatedAt: Date; id: string } => {
  const [iso, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  return { updatedAt: new Date(iso), id };
};
