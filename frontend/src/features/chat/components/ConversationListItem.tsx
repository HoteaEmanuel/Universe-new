import { FaUserCircle } from "react-icons/fa";
import { Users } from "lucide-react";
import { getFullName } from "../../../utils/fullName";
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
  const preview = lastMessage
    ? `${prefix}${lastMessage.content || "Image"}`
    : "No messages yet";

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
          ) : isGroup ? (
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Users className="size-6 text-muted-foreground" />
            </div>
          ) : (
            <FaUserCircle className="size-14 text-muted-foreground" />
          )}
          {!isGroup && isOnline && (
            <span className="absolute right-0.5 bottom-0.5 size-3.5 rounded-full bg-green-500 ring-2 ring-background" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-medium">{title}</p>
          <p className="truncate text-sm text-muted-foreground">{preview}</p>
        </div>
      </button>
    </li>
  );
};

export default ConversationListItem;
