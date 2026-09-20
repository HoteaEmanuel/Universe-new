import { useQuery } from "@tanstack/react-query";
import { useCommentsStore } from "../../store/commentStore";
export const useGetPostComments = (id) => {
  const { getComments } = useCommentsStore();
  return useQuery({
    queryFn: () => getComments(id),
    queryKey: ["comments", id],
  });
};
export const useGetPostCommentsCount = (id) => {
  const { getCommentsCount } = useCommentsStore();
  return useQuery({
    queryFn: () => getCommentsCount(id),
    queryKey: ["comments-count", id],
  });
};
