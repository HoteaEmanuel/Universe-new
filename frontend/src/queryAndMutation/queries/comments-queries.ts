import { createCommentQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const { useGetPostCommentsInfinite, useGetCommentRepliesInfinite, useGetPostCommentsCount } =
  createCommentQueryHooks(httpClient);
