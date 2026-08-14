import type { InfiniteData } from "@tanstack/react-query";
import type { PostComment, PostCommentsPage } from "../queryAndMutation/types";

type CommentsCache = InfiniteData<PostCommentsPage>;

export const prependOptimisticComment = (
  data: CommentsCache | undefined,
  comment: PostComment,
): CommentsCache | undefined => {
  if (!data || data.pages.length === 0) return data;
  const pages = [...data.pages];
  const firstPage = pages[0];
  // Shown at the top instantly for immediate feedback; the mutation's
  // onSettled refetch resorts it into its true likes-then-recency position.
  pages[0] = { ...firstPage, comments: [comment, ...firstPage.comments] };
  return { ...data, pages };
};

export const removeCommentFromPages = (
  data: CommentsCache | undefined,
  commentId: string,
): CommentsCache | undefined => {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      comments: page.comments.filter((comment) => comment.id !== commentId),
    })),
  };
};
