import { createCommentQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const {
  useGetPostCommentsInfinite,
  useGetCommentRepliesInfinite,
  useGetPostCommentsCount,
} = createCommentQueryHooks(httpClient);
