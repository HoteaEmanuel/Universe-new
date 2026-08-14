import { Camera } from "lucide-react";
import { getFullName } from "../../../utils/fullName";
import { getAvatarColorClass, getInitials } from "../utils/avatarColor";
import { formatChatListTime } from "../utils/chatListTime";
import type { ConversationListEntry } from "../types";

type ConversationListItemProps = {
  entry: ConversationListEntry;
  currentUserId: string;
  isOnline?: boolean;
  onClick: () => void;
};

const ConversationListItem = ({
  entry,
  currentUserId,
  isOnline,
  onClick,
}: ConversationListItemProps) => {
  const isGroup = !!entry.name;
  const avatarSrc = isGroup ? entry.coverImageUrl : entry.user?.profilePicture;
  const title = isGroup ? entry.name : getFullName(entry.user);

  const lastMessage = entry.lastMessage;
  const lastSender = lastMessage?.senderId;
  const lastSenderId =
    typeof lastSender === "string" ? lastSender : lastSender?.id;
  const prefix =
    lastSenderId === currentUserId
      ? "You: "
      : isGroup && lastSender && typeof lastSender !== "string"
        ? `${getFullName(lastSender)}: `
        : "";
  const isImageOnly = !lastMessage?.content && !!lastMessage?.imageUrls?.length;
  const time = formatChatListTime(entry.updatedAt);

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted cursor-pointer"
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
          <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
            {lastMessage ? (
              <>
                <span className="truncate">
                  {prefix}
                  {isImageOnly ? "" : lastMessage.content}
                </span>
                {isImageOnly && (
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <Camera className="size-3.5" /> Photo
                  </span>
                )}
              </>
            ) : (
              "No messages yet"
            )}
          </p>
        </div>
      </button>
    </li>
  );
};

export default ConversationListItem;
