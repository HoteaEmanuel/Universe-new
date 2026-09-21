import type { GroupConversation } from "./chat.js";
import type { SearchPage } from "./pagination.js";
import type { Post } from "./post.js";
import type { ChatUser } from "./user.js";

export type SearchOverview = {
  users: SearchPage<ChatUser>;
  posts: SearchPage<Post>;
  groups: SearchPage<GroupConversation>;
};
