import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCommentsStore } from "../../store/commentStore";
import type { PostCommentsPage } from "../types";

export const useGetPostCommentsInfinite = (id?: string) => {
  const { getComments } = useCommentsStore();
  return useInfiniteQuery<PostCommentsPage>({
    queryKey: ["comments", id],
    queryFn: ({ pageParam }) => getComments(id, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id,
  });
};

export const useGetPostCommentsCount = (id?: string) => {
  const { getCommentsCount } = useCommentsStore();
  return useQuery({
    queryFn: async () => (await getCommentsCount(id)) as number,
    queryKey: ["comments-count", id],
    enabled: !!id,
  });
};
