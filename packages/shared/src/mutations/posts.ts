import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createPostsApi } from "../api/posts.js";
import type { CreatePostPayload, Post, UpdatePostPayload } from "../post.js";
import { postKeys } from "../queries/keys.js";

type PostsApi = ReturnType<typeof createPostsApi>;

// The first element of every query key that can hold one or more `Post`
// objects - a single detail post, a plain array, or paginated `{posts}`
// pages. Scoped to this known set (rather than scanning every cached query)
// so patching a post's like/comment state can never touch an unrelated
// cache that happens to also hold an array of id-bearing objects.
const POST_CONTAINER_KEY_ROOTS = new Set<string>([
  postKeys.all[0],
  postKeys.detail("")[0],
  postKeys.byUser("")[0],
  postKeys.saved("")[0],
  postKeys.related("")[0],
  postKeys.byName("")[0],
  postKeys.opportunities({})[0],
]);

const isPost = (value: unknown): value is Post =>
  !!value && typeof value === "object" && "id" in value && "likesCount" in value;

const patchPost = (post: Post, postId: string, patch: (post: Post) => Post): Post =>
  post.id === postId ? patch(post) : post;

// Applies `patch` to every cached copy of the post with `postId`, wherever
// it currently lives (feed pages, profile/saved/related lists, opportunities
// pages, the single detail query) - a pure in-memory update, no network
// request. Used for likePost/unlikePost and for comment count changes,
// which both need to react in place on whichever post objects already
// cache this data instead of invalidating/refetching whole lists.
export const patchPostInCaches = (
  queryClient: QueryClient,
  postId: string,
  patch: (post: Post) => Post,
) => {
  queryClient.setQueriesData(
    { predicate: (query) => POST_CONTAINER_KEY_ROOTS.has(query.queryKey[0] as string) },
    (old: unknown) => {
      if (!old) return old;
      if (isPost(old)) return patchPost(old, postId, patch);
      if (Array.isArray(old)) {
        return old.map((item) => (isPost(item) ? patchPost(item, postId, patch) : item));
      }
      if (typeof old === "object" && "pages" in old) {
        const infinite = old as { pages: { posts?: Post[] }[] };
        return {
          ...infinite,
          pages: infinite.pages.map((page) =>
            page.posts
              ? { ...page, posts: page.posts.map((post) => patchPost(post, postId, patch)) }
              : page,
          ),
        };
      }
      return old;
    },
  );
};

// Toasts and other UI feedback are composed at the call site (app-local);
// these factories own only mutationFn + cache invalidation, which is
// identical across platforms.
export const createPostMutations = (api: PostsApi, queryClient: QueryClient) => ({
  create: <TFile>() =>
    mutationOptions({
      mutationFn: (post: CreatePostPayload<TFile>) => api.create(post),
      onSuccess: (_data: void, post: CreatePostPayload<TFile>) => {
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        if (post.type === "opportunity") {
          queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        }
      },
    }),

  update: <TFile>(userId?: string) =>
    mutationOptions({
      mutationFn: (data: UpdatePostPayload<TFile>) => api.update(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        queryClient.invalidateQueries({ queryKey: postKeys.byUser(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      },
    }),

  remove: (postId: string, userId?: string) =>
    mutationOptions({
      mutationFn: () => api.remove(postId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        queryClient.invalidateQueries({ queryKey: postKeys.byUser(userId ?? "") });
      },
    }),

  removeMany: (userId?: string) =>
    mutationOptions({
      mutationFn: (postIds: string[]) => api.removeMany(postIds),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        queryClient.invalidateQueries({ queryKey: postKeys.byUser(userId ?? "") });
      },
    }),

  // likesCount/isLikedByViewer now live on the post object itself (see
  // Post in ../post.ts), so liking patches every cached copy of that post
  // in place instead of a separate ["postLikes"/"postLiked", postId] cache -
  // onMutate can apply the change unconditionally since `like` is only ever
  // invoked from the not-yet-liked state. onSuccess still refetches the
  // single-post detail query to reconcile with the server (e.g. a like
  // count another viewer changed concurrently); it no longer refetches
  // whole lists, since the optimistic patch already covers those.
  like: (postId: string) =>
    mutationOptions({
      mutationFn: () => api.like(postId),
      onMutate: () => {
        patchPostInCaches(queryClient, postId, (post) => ({
          ...post,
          isLikedByViewer: true,
          likesCount: post.likesCount + 1,
        }));
      },
      onError: () => {
        patchPostInCaches(queryClient, postId, (post) => ({
          ...post,
          isLikedByViewer: false,
          likesCount: Math.max(0, post.likesCount - 1),
        }));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      },
    }),

  unlike: (postId: string) =>
    mutationOptions({
      mutationFn: () => api.unlike(postId),
      onMutate: () => {
        patchPostInCaches(queryClient, postId, (post) => ({
          ...post,
          isLikedByViewer: false,
          likesCount: Math.max(0, post.likesCount - 1),
        }));
      },
      onError: () => {
        patchPostInCaches(queryClient, postId, (post) => ({
          ...post,
          isLikedByViewer: true,
          likesCount: post.likesCount + 1,
        }));
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      },
    }),

  share: (postId: string) =>
    mutationOptions({
      mutationFn: ({ recipientIds, groupIds }: { recipientIds: string[]; groupIds: string[] }) =>
        api.share(postId, recipientIds, groupIds),
    }),

  setOpportunityClosed: (postId: string) =>
    mutationOptions({
      mutationFn: (closed: boolean) => api.setOpportunityClosed(postId, closed),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["opportunities"] });
        queryClient.invalidateQueries({ queryKey: postKeys.all });
        queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      },
    }),
});
