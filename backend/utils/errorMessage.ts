// Never JSON.stringify a caught error directly in a response: Prisma's
// error classes carry `code`/`meta`/`clientVersion` as own enumerable
// properties (unlike plain Error, which serializes to `{}`), so `{ error }`
// leaks internal details like constraint/column names to the client.
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Something went wrong";
