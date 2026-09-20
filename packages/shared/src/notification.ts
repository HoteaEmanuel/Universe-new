import type { NotificationType } from "./domain.js";
import type { NotificationActionUser } from "./user.js";
import type { NamedCursorPage } from "./pagination.js";

// Prisma's `Notification.type` column is a plain `String?`, while this was a
// 14-member literal union here and `string | null` on the old frontend type
// — three different truths for the same field. This union is the one to
// tighten the Prisma column toward, not the other way around.
export type Notification = {
  id: string;
  title?: string | null;
  message?: string | null;
  type?: NotificationType | null;
  read: boolean;
  createdAt: string;
  conversationId?: string | null;
  groupId?: string | null;
  eventId?: string | null;
  postId?: string | null;
  commentId?: string | null;
  actionUser?: NotificationActionUser | null;
};

export type NotificationsPage = NamedCursorPage<"notifications", Notification>;
