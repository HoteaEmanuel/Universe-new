import { useEffect, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageGroup } from "@/components/ui/message";
import MessageBubble from "./MessageBubble";
import FullImageModal from "../../../Modals/FullImageModal";
import type { ChatMessage, ChatUser } from "../types";

const MessageSkeletonRow = ({ align }: { align: "start" | "end" }) => (
  <div className={`flex px-2 py-1 ${align === "end" ? "justify-end" : "justify-start"}`}>
    <Skeleton className="h-9 w-40 rounded-2xl" />
  </div>
);

type MessageThreadProps = {
  messages?: ChatMessage[];
  currentUserId: string;
  otherParticipantLastReadAt?: string | null;
  variant: "direct" | "group";
  emptyLabel?: string;
  headerNote?: ReactNode;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  memberLookup?: Map<string, ChatUser>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
};

const SCROLL_BUTTON_THRESHOLD = 400;
const SCROLL_FETCH_THRESHOLD = 100;
// Message groups don't have a fixed height (text length, image count, and
// how many consecutive messages are bundled all vary) — this is just the
// initial guess react-virtual uses before `measureElement` corrects it to
// the group's real rendered height.
const ESTIMATED_GROUP_HEIGHT = 72;

const getSenderId = (message: ChatMessage) =>
  typeof message.senderId === "string" ? message.senderId : message.senderId.id;

const groupConsecutiveMessages = (messages: ChatMessage[]): ChatMessage[][] => {
  const groups: ChatMessage[][] = [];
  for (const message of messages) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && getSenderId(lastGroup[0]) === getSenderId(message)) {
      lastGroup.push(message);
    } else {
      groups.push([message]);
    }
  }
  return groups;
};

const MessageThread = ({
  messages,
  currentUserId,
  otherParticipantLastReadAt,
  variant,
  emptyLabel = "No messages yet. Say hi!",
  headerNote,
  onDelete,
  onEdit,
  onReact,
  memberLookup,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: MessageThreadProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const firstMessageIdRef = useRef<string | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const pinnedToBottomRef = useRef(true);
  const groups = messages ? groupConsecutiveMessages(messages) : [];
  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : undefined;
  const isLastMessageSeen =
    variant === "direct" &&
    !!lastMessage &&
    getSenderId(lastMessage) === currentUserId &&
    !!otherParticipantLastReadAt &&
    new Date(otherParticipantLastReadAt) >= new Date(lastMessage.createdAt);

  const virtualizer = useVirtualizer({
    count: groups.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ESTIMATED_GROUP_HEIGHT,
    overscan: 8,
    getItemKey: (index) => groups[index][0].id,
  });
  const totalSize = virtualizer.getTotalSize();

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pinnedToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [totalSize]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !messages || messages.length === 0) return;
    const firstId = messages[0].id;
    const lastId = messages[messages.length - 1].id;
    const isOlderPagePrepended =
      firstMessageIdRef.current !== null &&
      firstId !== firstMessageIdRef.current &&
      lastId === lastMessageIdRef.current &&
      prevScrollHeightRef.current !== null;

    if (isOlderPagePrepended) {
      el.scrollTop += el.scrollHeight - (prevScrollHeightRef.current ?? 0);
    } else if (lastId !== lastMessageIdRef.current) {
      bottomRef.current?.scrollIntoView({
        behavior: lastMessageIdRef.current === null ? "auto" : "smooth",
      });
    }

    prevScrollHeightRef.current = null;
    firstMessageIdRef.current = firstId;
    lastMessageIdRef.current = lastId;
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollButton(distanceFromBottom > SCROLL_BUTTON_THRESHOLD);
      pinnedToBottomRef.current = distanceFromBottom <= SCROLL_BUTTON_THRESHOLD;

      if (
        fetchNextPage &&
        hasNextPage &&
        !isFetchingNextPage &&
        el.scrollTop < SCROLL_FETCH_THRESHOLD
      ) {
        prevScrollHeightRef.current = el.scrollHeight;
        fetchNextPage();
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const scrollToBottom = () => {
    pinnedToBottomRef.current = true;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={containerRef} className="h-full overflow-y-auto px-1 py-4">
        {isFetchingNextPage && (
          <div className="mb-4 flex flex-col gap-1">
            <MessageSkeletonRow align="start" />
            <MessageSkeletonRow align="end" />
            <MessageSkeletonRow align="start" />
          </div>
        )}
        {headerNote}
        {messages && messages.length > 0 ? (
          <div
            style={{ height: virtualizer.getTotalSize() }}
            className="relative"
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const group = groups[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full pb-4"
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  <MessageGroup className="gap-px">
                    {group.map((message, index) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        currentUserId={currentUserId}
                        variant={variant}
                        isFirstInGroup={index === 0}
                        isLastInGroup={index === group.length - 1}
                        showSeen={isLastMessageSeen && message.id === lastMessage?.id}
                        onOpenImage={setFullImage}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onReact={onReact}
                        memberLookup={memberLookup}
                      />
                    ))}
                  </MessageGroup>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {showScrollButton && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={scrollToBottom}
          aria-label="Scroll to latest messages"
          className="absolute bottom-4 right-4 rounded-full shadow-md"
        >
          <ChevronDown />
        </Button>
      )}

      <FullImageModal
        image={fullImage}
        open={!!fullImage}
        onClose={() => setFullImage(null)}
      />
    </div>
  );
};

export default MessageThread;
