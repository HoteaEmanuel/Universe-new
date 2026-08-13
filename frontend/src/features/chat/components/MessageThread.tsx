import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageGroup } from "@/components/ui/message";
import MessageBubble from "./MessageBubble";
import FullImageModal from "../../../Modals/FullImageModal";
import type { ChatMessage } from "../types";

type MessageThreadProps = {
  messages?: ChatMessage[];
  currentUserId: string;
  variant: "direct" | "group";
  emptyLabel?: string;
  headerNote?: ReactNode;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
};

const SCROLL_BUTTON_THRESHOLD = 400;

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
  variant,
  emptyLabel = "No messages yet. Say hi!",
  headerNote,
  onDelete,
  onEdit,
}: MessageThreadProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [fullImage, setFullImage] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollButton(distanceFromBottom > SCROLL_BUTTON_THRESHOLD);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={containerRef} className="h-full overflow-y-auto px-1 py-4">
        {headerNote}
        {messages && messages.length > 0 ? (
          <div className="flex flex-col gap-4">
            {groupConsecutiveMessages(messages).map((group) => (
              <MessageGroup key={group[0].id} className="gap-px">
                {group.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    variant={variant}
                    isFirstInGroup={index === 0}
                    isLastInGroup={index === group.length - 1}
                    onOpenImage={setFullImage}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))}
              </MessageGroup>
            ))}
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
