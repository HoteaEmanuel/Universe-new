import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SmilePlus } from "lucide-react";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getFullName } from "../../../utils/fullName";
import { formatDateDetailed } from "../../../utils/formatDate";
import { urlPathName } from "../../../utils/urlPathFromName";
import MessageActionsMenu from "./MessageActionsMenu";
import EmojiPickerPopover from "./EmojiPickerPopover";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import MessageImageGrid from "./MessageImageGrid";
import MessageFileList from "./MessageFileList";
import SharedPostCard from "./SharedPostCard";
import PollBlock from "@/features/polls/components/PollBlock";
import MentionText from "@/components/MentionText";
import type { ChatMessage, ChatUser, MessageAttachment } from "../types";

type MessageBubbleProps = {
  message: ChatMessage;
  currentUserId: string;
  variant: "direct" | "group";
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showSeen?: boolean;
  onOpenGallery: (images: string[], index: number) => void;
  onOpenFiles: (attachments: MessageAttachment[], index: number) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  memberLookup?: Map<string, ChatUser>;
};

const MAX_VISIBLE_REACTION_PILLS = 5;

const summarizeReactions = (
  reactions: ChatMessage["reactions"],
  currentUserId: string,
) => {
  const summary = new Map<string, { emoji: string; userIds: string[] }>();
  for (const reaction of reactions ?? []) {
    const entry = summary.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      userIds: [],
    };
    entry.userIds.push(reaction.userId);
    summary.set(reaction.emoji, entry);
  }
  return [...summary.values()]
    .map((entry) => ({
      ...entry,
      count: entry.userIds.length,
      reactedByMe: entry.userIds.includes(currentUserId),
    }))
    .sort((a, b) => b.count - a.count);
};

const resolveReactorName = (
  userId: string,
  currentUserId: string,
  memberLookup?: Map<string, ChatUser>,
) => {
  if (userId === currentUserId) return "You";
  const user = memberLookup?.get(userId);
  return user ? getFullName(user) : "Member";
};

const MAX_VISIBLE_REACTOR_NAMES = 10;

const formatReactorNames = (
  userIds: string[],
  currentUserId: string,
  memberLookup?: Map<string, ChatUser>,
) => {
  const names = userIds
    .slice(0, MAX_VISIBLE_REACTOR_NAMES)
    .map((userId) => resolveReactorName(userId, currentUserId, memberLookup));
  const remaining = userIds.length - names.length;
  return remaining > 0
    ? `${names.join(", ")} and ${remaining} more`
    : names.join(", ");
};

type ReactionSummary = {
  emoji: string;
  userIds: string[];
  count: number;
  reactedByMe: boolean;
};

type ReactionsRowProps = {
  reactions: ReactionSummary[];
  variant: "direct" | "group";
  align: "start" | "end";
  currentUserId: string;
  onReact: (emoji: string) => void;
  memberLookup?: Map<string, ChatUser>;
};

const ReactionPill = ({
  emoji,
  count,
  reactedByMe,
}: Pick<ReactionSummary, "emoji" | "count" | "reactedByMe">) => (
  <span
    className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs ${
      reactedByMe
        ? "border-primary bg-primary/10 text-primary dark:border-brand-300/60 dark:bg-brand-400/15 dark:text-brand-100"
        : "border-border bg-background text-foreground"
    }`}
  >
    <span>{emoji}</span>
    <span>{count}</span>
  </span>
);

const OverflowPill = ({ count }: { count: number }) => (
  <span className="flex items-center rounded-full border border-border bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
    +{count}
  </span>
);

const ReactionsRow = ({
  reactions,
  variant,
  align,
  currentUserId,
  onReact,
  memberLookup,
}: ReactionsRowProps) => {
  const visible = reactions.slice(0, MAX_VISIBLE_REACTION_PILLS);
  const overflowCount = reactions.length - visible.length;

  if (variant === "direct") {
    return (
      <div className="flex flex-wrap gap-1">
        {visible.map(({ emoji, count, reactedByMe }) => (
          <button key={emoji} type="button" onClick={() => onReact(emoji)}>
            <ReactionPill emoji={emoji} count={count} reactedByMe={reactedByMe} />
          </button>
        ))}
        {overflowCount > 0 && <OverflowPill count={overflowCount} />}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        render={<div className="flex w-fit cursor-pointer flex-wrap gap-1" />}
      >
        {visible.map(({ emoji, count, reactedByMe }) => (
          <ReactionPill
            key={emoji}
            emoji={emoji}
            count={count}
            reactedByMe={reactedByMe}
          />
        ))}
        {overflowCount > 0 && <OverflowPill count={overflowCount} />}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-56 p-2">
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {reactions.map(({ emoji, userIds }) => (
            <div key={emoji} className="flex items-start gap-2 text-sm">
              <span>{emoji}</span>
              <span className="text-muted-foreground">
                {formatReactorNames(userIds, currentUserId, memberLookup)}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const MessageBubble = ({
  message,
  currentUserId,
  variant,
  isFirstInGroup = true,
  isLastInGroup = true,
  showSeen = false,
  onOpenGallery,
  onOpenFiles,
  onDelete,
  onEdit,
  onReact,
  memberLookup,
}: MessageBubbleProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const senderId = message.senderId;
  const senderUser: ChatUser | null = message.sender ?? null;
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/u/${urlPathName(senderUser)}`)}
              aria-label={`View ${getFullName(senderUser)}'s profile`}
              className="h-auto rounded-full p-0 hover:bg-transparent"
            >
              <UserAvatar user={senderUser} className="size-8" />
            </Button>
          </MessageAvatar>
        ) : (
          <div className="size-8 shrink-0" aria-hidden="true" />
        ))}

      <MessageContent className="max-w-[75%] sm:max-w-[65%]">
        {showHeader && (
          <MessageHeader>{getFullName(senderUser)}</MessageHeader>
        )}

        {!message.deleted && message.imageUrls && message.imageUrls.length > 0 && (
          <div data-slot="message-images">
            <MessageImageGrid
              images={message.imageUrls}
              onOpen={(index) => onOpenGallery(message.imageUrls!, index)}
            />
          </div>
        )}

        {!message.deleted && message.attachments && message.attachments.length > 0 && (
          <div data-slot="message-files">
            <MessageFileList
              attachments={message.attachments}
              isOwn={isOwn}
              onOpen={(index) => onOpenFiles(message.attachments!, index)}
            />
          </div>
        )}

        {!message.deleted && message.sharedPost && (
          <div data-slot="message-shared-post">
            <SharedPostCard post={message.sharedPost} isOwn={isOwn} />
          </div>
        )}

        {!message.deleted && message.poll && (
          <div data-slot="message-poll">
            <PollBlock
              poll={message.poll}
              invalidateKeys={[["group-messages", message.groupId]]}
            />
          </div>
        )}

        {!message.deleted && message.audioUrl && (
          <div
            data-slot="message-audio"
            className={`w-fit rounded-2xl px-2 py-1 ${
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <VoiceMessagePlayer
              url={message.audioUrl}
              durationSec={message.audioDurationSec}
              isOwn={isOwn}
            />
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
              <MentionText
                text={message.content}
                mentionedUsers={message.mentionedUsers ?? []}
                variant={isOwn ? "on-accent" : "default"}
              />
            )}
          </div>
        )}

        {!message.deleted && (message.reactions?.length ?? 0) > 0 && (
          <div data-slot="message-reactions">
            <ReactionsRow
              reactions={summarizeReactions(message.reactions, currentUserId)}
              variant={variant}
              align={isOwn ? "end" : "start"}
              onReact={(emoji) => onReact(message.id, emoji)}
              currentUserId={currentUserId}
              memberLookup={memberLookup}
            />
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
          {!message.deleted && (
            <span
              className={`flex items-center ${
                isHovered ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <EmojiPickerPopover
                onPick={(emoji) => onReact(message.id, emoji)}
                align={isOwn ? "end" : "start"}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="React with emoji"
                  >
                    <SmilePlus className="size-3.5" />
                  </Button>
                }
              />
              {isOwn && (
                <MessageActionsMenu
                  message={message}
                  onDelete={() => onDelete(message.id)}
                  onEdit={(newContent) => onEdit(message.id, newContent)}
                />
              )}
            </span>
          )}
        </MessageFooter>
        {showSeen && (
          <span
            data-slot="message-seen"
            className="px-3 text-xs text-muted-foreground"
          >
            Seen
          </span>
        )}
      </MessageContent>
    </Message>
  );
};

export default MessageBubble;
