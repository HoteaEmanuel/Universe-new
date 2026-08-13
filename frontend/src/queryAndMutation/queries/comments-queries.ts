import { useQuery } from "@tanstack/react-query";
import { useCommentsStore } from "../../store/commentStore";
import type { PostComment } from "../types";

export const useGetPostComments = (id?: string) => {
  const { getComments } = useCommentsStore();
  return useQuery({
    queryFn: async () => {
      const comments = (await getComments(id)) as PostComment[];
      return [...comments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    queryKey: ["comments", id],
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
