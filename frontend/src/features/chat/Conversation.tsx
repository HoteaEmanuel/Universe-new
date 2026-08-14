import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetConvoMessagesInfinite,
  useGetUserByConvoId,
} from "@/queryAndMutation/queries/conversation-queries";
import {
  useDeleteMessageMutation,
  useEditMessageMutation,
  useReactToMessageMutation,
} from "@/queryAndMutation/mutations/conversation-mutation";
import { useSeeNewMessages } from "@/queryAndMutation/mutations/notification-mutation";
import { useAuthStore } from "@/store/authStore";
import ChatUserHeader from "./components/ChatUserHeader";
import MessageThread from "./components/MessageThread";
import MessageInput from "./components/MessageInput";
import TypingIndicator from "./components/TypingIndicator";
import { useTypingIndicator } from "./hooks/useTypingIndicator";
import ChatMediaModal from "./components/ChatMediaModal";
import type { ChatUser } from "./types";

const Conversation = () => {
  const navigate = useNavigate();
  const { id: convoId } = useParams();
  const [mediaOpen, setMediaOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user: authUser, socket, onlineUsers } = useAuthStore() as {
    user: ChatUser;
    socket: { on: Function; off?: Function; emit: Function };
    onlineUsers: string[];
  };
  const { data: otherUser, isPending: isPendingUser } =
    useGetUserByConvoId(convoId);
  const { mutate: seeNewMessages } = useSeeNewMessages(authUser.id, convoId);
  const {
    data: messagePages,
    isPending: isPendingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetConvoMessagesInfinite(convoId);
  const messages = messagePages?.pages
    .slice()
    .reverse()
    .flatMap((page) => page.messages);
  const { mutate: deleteMessage } = useDeleteMessageMutation(convoId);
  const { mutate: editMessage } = useEditMessageMutation(convoId);
  const { mutate: reactToMessage } = useReactToMessageMutation(convoId);
  const typingUsers = useTypingIndicator(convoId);

  useEffect(() => {
    const invalidateMessages = () =>
      queryClient.invalidateQueries({
        queryKey: ["conversation_messages", convoId],
      });
    socket.on("newMessage", invalidateMessages);
    socket.on("messageEdited", invalidateMessages);
    socket.on("messageDeleted", invalidateMessages);
    socket.on("reactionAdded", invalidateMessages);
    socket.on("reactionRemoved", invalidateMessages);
    return () => {
      socket.off?.("newMessage", invalidateMessages);
      socket.off?.("messageEdited", invalidateMessages);
      socket.off?.("messageDeleted", invalidateMessages);
      socket.off?.("reactionAdded", invalidateMessages);
      socket.off?.("reactionRemoved", invalidateMessages);
    };
  }, [socket, queryClient, convoId]);

  useEffect(() => {
    socket.emit("view_conversation", convoId, authUser.id);
    seeNewMessages();
    return () => {
      socket.emit("leave_conversation", convoId, authUser.id);
    };
  }, [seeNewMessages, socket, authUser, convoId]);

  return (
    <section className="flex h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-border md:h-[calc(100dvh-4rem)]">
      {isPendingUser ? (
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to messages"
            className="shrink-0"
            onClick={() => navigate("/chat")}
          >
            <ArrowLeft />
          </Button>
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ) : (
        otherUser && (
          <ChatUserHeader
            user={otherUser}
            isOnline={onlineUsers.includes(otherUser.id)}
            actions={
              <Button
                variant="ghost"
                size="icon"
                aria-label="View media"
                onClick={() => setMediaOpen(true)}
              >
                <Images />
              </Button>
            }
          />
        )
      )}

      {isPendingMessages ? (
        <div className="flex-1" />
      ) : (
        <MessageThread
          messages={messages}
          currentUserId={authUser.id}
          variant="direct"
          onDelete={deleteMessage}
          onEdit={(id, newContent) => editMessage({ id, newContent })}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          onReact={(id, emoji) => reactToMessage({ id, emoji })}
        />
      )}

      <TypingIndicator typingUsers={typingUsers} variant="direct" />
      <MessageInput variant="direct" id={convoId as string} />

      <ChatMediaModal
        variant="direct"
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
      />
    </section>
  );
};

export default Conversation;
