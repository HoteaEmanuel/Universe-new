import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message";
import { getFullName } from "../../../utils/fullName";
import { formatDateDetailed } from "../../../utils/formatDate";
import { urlPathName } from "../../../utils/urlPathFromName";
import MessageActionsMenu from "./MessageActionsMenu";
import type { ChatMessage, ChatUser } from "../types";

type MessageBubbleProps = {
  message: ChatMessage;
  currentUserId: string;
  variant: "direct" | "group";
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  onOpenImage: (image: string) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
};

const MessageBubble = ({
  message,
  currentUserId,
  variant,
  isFirstInGroup = true,
  isLastInGroup = true,
  onOpenImage,
  onDelete,
  onEdit,
}: MessageBubbleProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const sender = message.senderId;
  const senderId = typeof sender === "string" ? sender : sender._id;
  const senderUser: ChatUser | null = typeof sender === "string" ? null : sender;
  const isOwn = senderId === currentUserId;
  const isGroupChat = variant === "group" && !isOwn;
  const showHeader = isGroupChat && isFirstInGroup;
  const showAvatar = isGroupChat && isLastInGroup;

  return (
    <Message
      align={isOwn ? "end" : "start"}
      className="px-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isGroupChat &&
        (showAvatar ? (
          <MessageAvatar>
            <button
              type="button"
              onClick={() => navigate(`/users/${urlPathName(senderUser)}`)}
              aria-label={`View ${getFullName(senderUser)}'s profile`}
              className="cursor-pointer"
            >
              {senderUser?.profilePicture ? (
                <img
                  src={senderUser.profilePicture}
                  alt={getFullName(senderUser)}
                  className="size-8 object-cover"
                />
              ) : (
                <FaUserCircle className="size-8 text-muted-foreground" />
              )}
            </button>
          </MessageAvatar>
        ) : (
          <div className="size-8 shrink-0" aria-hidden="true" />
        ))}

      <MessageContent className="max-w-[75%] sm:max-w-[65%]">
        {showHeader && (
          <MessageHeader>{getFullName(senderUser)}</MessageHeader>
        )}

        {!message.deleted && message.imageUrls && message.imageUrls.length > 0 && (
          <div data-slot="message-images" className="flex flex-col gap-1">
            {message.imageUrls.map((image, index) => (
              <img
                key={index}
                src={image}
                alt="attachment"
                className="max-h-72 max-w-full cursor-pointer rounded-2xl object-cover"
                onClick={() => onOpenImage(image)}
              />
            ))}
          </div>
        )}

        {(message.deleted || message.content) && (
          <div
            data-slot="message-bubble"
            className={`w-fit rounded-2xl px-3 py-2 text-sm wrap-break-word ${
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {message.deleted ? (
              <span className="italic opacity-70">
                This message was deleted
              </span>
            ) : (
              message.content
            )}
          </div>
        )}

        <MessageFooter>
          <span
            className={
              isLastInGroup || isHovered
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }
          >
            {!message.deleted && message.edited && "Edited · "}
            {formatDateDetailed(
              message.deleted
                ? message.createdAt
                : message.updatedAt || message.createdAt,
            )}
          </span>
          {isOwn && !message.deleted && (
            <span
              className={isHovered ? "opacity-100" : "pointer-events-none opacity-0"}
            >
              <MessageActionsMenu
                message={message}
                onDelete={() => onDelete(message._id)}
                onEdit={(newContent) => onEdit(message._id, newContent)}
              />
            </span>
          )}
        </MessageFooter>
      </MessageContent>
    </Message>
  );
};

export default MessageBubble;
