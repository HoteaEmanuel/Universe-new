import { prisma } from "../database/prisma.js";
import type { AccountType, GroupVisibility } from "../generated/prisma/client.js";

interface SearchPage<T> {
  items: T[];
  hasMore: boolean;
}

const toSearchPage = <T>(rows: T[], limit: number): SearchPage<T> => {
  const hasMore = rows.length > limit;
  return { items: hasMore ? rows.slice(0, limit) : rows, hasMore };
};

// Fuzzy fallback lets typo'd queries ("Jhon") still surface results that the
// full-text match alone would miss. Exported so other searchVector-backed
// pagers (e.g. conversation/group list search) use the same threshold.
export const TRIGRAM_THRESHOLD = 0.25;

export interface UserSearchRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  profilePicture: string | null;
  university: string | null;
  accountType: AccountType;
}

export const searchUsers = async (query: string, limit = 20, offset = 0) => {
  const rows = await prisma.$queryRaw<UserSearchRow[]>`
    SELECT id, "firstName", "lastName", name, "profilePicture", university, "accountType"
    FROM users
    WHERE "searchVector" @@ websearch_to_tsquery('simple', ${query})
       OR similarity(coalesce(name, '') || ' ' || coalesce("firstName", '') || ' ' || coalesce("lastName", ''), ${query}) > ${TRIGRAM_THRESHOLD}
    ORDER BY
      ts_rank("searchVector", websearch_to_tsquery('simple', ${query})) DESC,
      similarity(coalesce(name, '') || ' ' || coalesce("firstName", '') || ' ' || coalesce("lastName", ''), ${query}) DESC,
      id
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
  return toSearchPage(rows, limit);
};

export interface PostSearchRow {
  id: string;
  userId: string;
  imagesUrls: string[];
  imagesPublicIds: string[];
  title: string;
  body: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const searchPosts = async (query: string, limit = 20, offset = 0) => {
  const rows = await prisma.$queryRaw<PostSearchRow[]>`
    SELECT p.id, p."userId", p."imagesUrls", p."imagesPublicIds", p.title, p.body, p.location, p."createdAt", p."updatedAt"
    FROM posts p
    WHERE p."searchVector" @@ websearch_to_tsquery('simple', ${query})
       OR similarity(coalesce(p.title, ''), ${query}) > ${TRIGRAM_THRESHOLD}
       OR EXISTS (
         SELECT 1 FROM "_PostTags" pt
         JOIN tags t ON t.id = pt."B"
         WHERE pt."A" = p.id AND t.name ILIKE ${`%${query}%`}
       )
    ORDER BY
      ts_rank(p."searchVector", websearch_to_tsquery('simple', ${query})) DESC,
      similarity(coalesce(p.title, ''), ${query}) DESC,
      p.id
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
  return toSearchPage(rows, limit);
};

export interface GroupSearchRow {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  visibility: GroupVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export const searchGroups = async (
  query: string,
  userId: string,
  limit = 20,
  offset = 0,
) => {
  const rows = await prisma.$queryRaw<GroupSearchRow[]>`
    SELECT g.id, g.name, g.description, g."coverImageUrl", g.visibility, g."createdAt", g."updatedAt"
    FROM groups g
    WHERE (
      g.visibility = 'public'
      OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm."groupId" = g.id AND gm."memberId" = ${userId}
      )
    )
    AND (
      g."searchVector" @@ websearch_to_tsquery('simple', ${query})
      OR similarity(coalesce(g.name, ''), ${query}) > ${TRIGRAM_THRESHOLD}
    )
    ORDER BY
      ts_rank(g."searchVector", websearch_to_tsquery('simple', ${query})) DESC,
      similarity(coalesce(g.name, ''), ${query}) DESC,
      g.id
    LIMIT ${limit + 1} OFFSET ${offset}
  `;
  return toSearchPage(rows, limit);
};
