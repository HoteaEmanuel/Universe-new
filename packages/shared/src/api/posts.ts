import type { HttpClient } from "./client.js";
import type {
  CreatePostPayload,
  OpportunitiesPage,
  OpportunityFilters,
  Post,
  PostsPage,
  PublicPost,
  RelevantLiker,
  ShareRecipientsResponse,
  UpdatePostPayload,
  UsersWhoLikedPage,
} from "../post.js";
import type { PostAuthor } from "../user.js";

// Field-building logic for create/update, shared once instead of
// duplicated per platform — this is exactly the kind of thing that drifted
// out of sync on mobile (it still posts to the pre-Prisma field names).
const appendPostFields = <TFile>(
  form: ReturnType<HttpClient["createForm"]>,
  post: Partial<CreatePostPayload<TFile>> & Partial<UpdatePostPayload<TFile>>,
) => {
  if (post.title !== undefined) form.append("title", post.title);
  if (post.body) form.append("body", post.body);
  if (post.location) form.append("location", post.location);
  if (post.tags !== undefined) form.append("tags", post.tags);
  if (post.type) form.append("type", post.type);
  post.images?.forEach((image) => form.append("images", image));
  if (post.type === "opportunity") {
    if (post.opportunityType) form.append("opportunityType", post.opportunityType);
    if (post.workplaceType) form.append("workplaceType", post.workplaceType);
    if (post.companyName) form.append("companyName", post.companyName);
    if (post.applyUrl) form.append("applyUrl", post.applyUrl);
    if (post.deadlineAt) form.append("deadlineAt", post.deadlineAt);
    if (post.expiresAt) form.append("expiresAt", post.expiresAt);
  }
};

export const createPostsApi = (client: HttpClient) => ({
  get: async (id: string) => (await client.get<{ post: Post }>(`/post/${id}`)).post,

  getPublic: async (id: string) =>
    (await client.get<{ post: PublicPost }>(`/public/post/${id}`)).post,

  getAuthor: async (id: string) =>
    (await client.get<{ user: PostAuthor }>(`/post-user/${id}`)).user,

  listByUser: async (id: string) =>
    (await client.get<{ posts: Post[] }>(`/user-posts/${id}`)).posts,

  listSaved: async (id: string) =>
    (await client.get<{ savedPosts: Post[] }>(`/saved-posts/${id}`)).savedPosts,

  isSaved: (id: string) => client.get<{ isSaved: boolean }>(`/check-saved/${id}`),

  listRelated: async (tag: string) =>
    (await client.get<{ posts: Post[] }>(`/related-posts/${tag}`)).posts,

  list: (feed: string, cursor?: string) =>
    client.get<PostsPage>(`/posts/${feed}`, cursor ? { cursor } : undefined),

  searchByName: async (name: string) =>
    (await client.get<{ posts: Post[] }>(`/posts-by-name/${name}`)).posts,

  listOpportunities: (filters: OpportunityFilters, cursor?: string) =>
    client.get<OpportunitiesPage>("/posts/opportunities", {
      ...filters,
      savedOnly: filters.savedOnly ? "true" : "false",
      ...(cursor ? { cursor } : {}),
    }),

  setOpportunityClosed: (id: string, closed: boolean) =>
    client.patch<void>(`/posts/${id}/opportunity-status`, { closed }),

  getLikesCount: async (postId: string) =>
    (await client.get<{ likes: number }>(`/likes/${postId}`)).likes,

  getRelevantLiker: async (postId: string) =>
    (await client.get<{ relevantLiker: RelevantLiker }>(`/relevant-liker/${postId}`))
      .relevantLiker,

  hasLiked: async (postId: string) =>
    (await client.get<{ hasLiked: boolean }>(`/user-liked/${postId}`)).hasLiked,

  listWhoLiked: (postId: string, cursor?: string) =>
    client.get<UsersWhoLikedPage>(`/users-who-liked/${postId}`, cursor ? { cursor } : undefined),

  like: (postId: string) => client.post<{ message: string }>("/like-post", { postId }),

  unlike: (postId: string) => client.post<{ message: string }>("/unlike-post", { postId }),

  getShareRecipients: () => client.get<ShareRecipientsResponse>("/share-recipients"),

  share: (postId: string, recipientIds: string[], groupIds: string[]) =>
    client.post<void>(`/post/${postId}/share`, { recipientIds, groupIds }),

  create: <TFile>(post: CreatePostPayload<TFile>) => {
    const form = client.createForm();
    appendPostFields(form, { ...post, type: post.type ?? "standard" });
    if (post.poll) {
      form.append("pollQuestion", post.poll.question);
      post.poll.options.forEach((option) => form.append("pollOptions", option));
      if (post.poll.closesAt) form.append("pollClosesAt", post.poll.closesAt);
    }
    return client.postForm<void>("/posts", form);
  },

  update: <TFile>(data: UpdatePostPayload<TFile>) => {
    const form = client.createForm();
    appendPostFields(form, data);
    return client.patchForm<void>(`/posts/${data.id}`, form);
  },

  remove: (id: string) => client.delete<void>(`/posts/${id}`),

  removeMany: (ids: string[]) =>
    client.delete<{ deletedIds: string[] }>("/posts", { ids }),
});
