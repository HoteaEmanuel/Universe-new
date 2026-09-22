import { createSearchQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const {
  useSearchOverviewQuery,
  useSearchUsersInfinite,
  useSearchPostsInfinite,
  useSearchGroupsInfinite,
} = createSearchQueryHooks(httpClient);
