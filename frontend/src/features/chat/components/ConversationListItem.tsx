import type { ReactNode } from "react";
import { Camera, Mic, Paperclip, Send } from "lucide-react";
import { getFullName } from "../../../utils/fullName";
import { getAvatarColorClass, getInitials } from "../utils/avatarColor";
import { formatChatListTime } from "../utils/chatListTime";
import type { ConversationListEntry } from "../types";

type ConversationListItemProps = {
  entry: ConversationListEntry;
  currentUserId: string;
  isOnline?: boolean;
  onClick: () => void;
  trailingAction?: ReactNode;
};

const ConversationListItem = ({
  entry,
  currentUserId,
  isOnline,
  onClick,
  trailingAction,
}: ConversationListItemProps) => {
  const isGroup = !!entry.name;
  const avatarSrc = isGroup ? entry.coverImageUrl : entry.user?.profilePicture;
  const title = isGroup ? entry.name : getFullName(entry.user);

  const lastMessage = entry.lastMessage;
  const lastSenderId = lastMessage?.senderId;
  const lastSender = lastMessage?.sender;
  const prefix =
    lastSenderId === currentUserId
      ? "You: "
      : isGroup && lastSender
        ? `${getFullName(lastSender)}: `
        : "";
  const isImageOnly = !lastMessage?.content && !!lastMessage?.imageUrls?.length;
  const isVoiceOnly = !lastMessage?.content && !!lastMessage?.audioUrl;
  const isFileOnly = !lastMessage?.content && !!lastMessage?.attachments?.length;
  const isSharedPostOnly = !lastMessage?.content && !!lastMessage?.sharedPostId;
  const time = formatChatListTime(entry.updatedAt);
  const unreadCount = "unreadCount" in entry ? (entry.unreadCount ?? 0) : 0;
  const hasUnread = unreadCount > 0;

  return (
    <li>
      <div className="flex items-center gap-1 rounded-xl transition-colors hover:bg-muted">
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left cursor-pointer"
        >
          <div className="relative shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={title}
                className="size-14 rounded-full object-cover"
              />
            ) : (
              <div
                className={`flex size-14 items-center justify-center rounded-full font-medium text-white ${getAvatarColorClass(entry.id)}`}
              >
                {getInitials(title)}
              </div>
            )}
            {!isGroup && isOnline && (
              <span className="absolute right-0.5 bottom-0.5 size-3.5 rounded-full bg-green-500 ring-2 ring-background" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate font-medium">{title}</p>
              {lastMessage && (
                <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
              )}
            </div>
            <p
              className={`flex items-center gap-1 truncate text-sm ${
                hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {lastMessage ? (
                unreadCount > 1 ? (
                  <span className="truncate">+{unreadCount} new messages</span>
                ) : (
                  <>
                    <span className="truncate">
                      {prefix}
                      {isImageOnly || isVoiceOnly || isFileOnly || isSharedPostOnly
                        ? ""
                        : lastMessage.content}
                    </span>
                    {isImageOnly && (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Camera className="size-3.5" /> Photo
                      </span>
                    )}
                    {isVoiceOnly && (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Mic className="size-3.5" /> Voice message
                      </span>
                    )}
                    {isFileOnly && (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Paperclip className="size-3.5" /> File
                      </span>
                    )}
                    {isSharedPostOnly && (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Send className="size-3.5" /> Shared a post
                      </span>
                    )}
                  </>
                )
              ) : (
                "No messages yet"
              )}
            </p>
          </div>
        </button>
        {trailingAction && <div className="shrink-0 pr-2">{trailingAction}</div>}
      </div>
    </li>
  );
};

export default ConversationListItem;
