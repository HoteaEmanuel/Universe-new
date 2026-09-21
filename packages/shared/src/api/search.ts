import type { GroupConversation } from "../chat.js";
import type { SearchPage } from "../pagination.js";
import type { Post } from "../post.js";
import type { SearchOverview } from "../search.js";
import type { ChatUser } from "../user.js";
import type { HttpClient } from "./client.js";

export const createSearchApi = (client: HttpClient) => ({
  overview: (query: string) => client.get<SearchOverview>("/search", { q: query }),

  listUsers: (query: string, offset?: number) =>
    client.get<SearchPage<ChatUser>>("/search/users", { q: query, offset }),

  listPosts: (query: string, offset?: number) =>
    client.get<SearchPage<Post>>("/search/posts", { q: query, offset }),

  listGroups: (query: string, offset?: number) =>
    client.get<SearchPage<GroupConversation>>("/search/groups", { q: query, offset }),
});
