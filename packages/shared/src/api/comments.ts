import type { HttpClient } from "./client.js";
import type { PostCommentsPage } from "../post.js";

export const createCommentsApi = (client: HttpClient) => ({
  list: (postId: string, cursor?: string, limit?: number) =>
    client.get<PostCommentsPage>(`/posts/${postId}/comments`, { cursor, limit }),

  listReplies: (postId: string, parentId: string, cursor?: string, limit?: number) =>
    client.get<PostCommentsPage>(`/posts/${postId}/comments/${parentId}/replies`, {
      cursor,
      limit,
    }),

  getCount: async (postId: string) =>
    (await client.get<{ commentsCount: number }>(`/posts/${postId}/comments-count`))
      .commentsCount,

  send: (postId: string, comment: string, parentId?: string) =>
    client.post<{ message: string }>(`/posts/${postId}/send-comment`, { comment, parentId }),

  // Despite the `/posts/:id/...` shape (inherited from the backend route),
  // `:id` here is the comment id, not the post id.
  like: (commentId: string) => client.post<{ message: string }>(`/posts/${commentId}/like-comment`),

  unlike: (commentId: string) =>
    client.post<{ message: string }>(`/posts/${commentId}/remove-like-comment`),

  remove: (commentId: string) =>
    client.delete<{ message: string }>(`/posts/${commentId}/delete-comment`),
});
