// Shared "search a user by name/username" filter, reused anywhere a list of
// users needs to be narrowed by a free-text query (event participants, group
// members, follow lists, ...).
export const userNameSearchClause = (search: string) => ({
  OR: [
    { name: { contains: search, mode: "insensitive" as const } },
    { firstName: { contains: search, mode: "insensitive" as const } },
    { lastName: { contains: search, mode: "insensitive" as const } },
    { username: { contains: search, mode: "insensitive" as const } },
  ],
});
