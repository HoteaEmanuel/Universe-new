import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetActiveGroupMembers,
  useGetGroupById,
  useGetGroupMembers,
  useGetGroupMessagesInfinite,
} from "@/queryAndMutation/queries/group-queries";
import {
  useDeleteMessageInGroupMutation,
  useEditMessageInGroupMutation,
  useReactToGroupMessageMutation,
} from "@/queryAndMutation/mutations/group-mutation";
import { useSeeNewMessages } from "@/queryAndMutation/mutations/notification-mutation";
import { useAuthStore } from "@/store/authStore";
import MessageThread from "@/features/chat/components/MessageThread";
import MessageInput from "@/features/chat/components/MessageInput";
import TypingIndicator from "@/features/chat/components/TypingIndicator";
import { useTypingIndicator } from "@/features/chat/hooks/useTypingIndicator";
import GroupMenuModal from "./components/GroupMenuModal";
import ProfileImageModal from "@/Modals/ProfileImageModal";
import type { ChatUser } from "@/features/chat/types";

const Group = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [groupImageOpen, setGroupImageOpen] = useState(false);
  const { user, socket } = useAuthStore() as {
    user: ChatUser;
    socket: { on: Function; off?: Function; emit: Function };
  };
  const queryClient = useQueryClient();
  const { data: group, isPending: isPendingGroup } = useGetGroupById(id);
  const { mutate: seeNewMessages } = useSeeNewMessages(user.id, id);
  const {
    data: messagePages,
    isPending: isPendingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetGroupMessagesInfinite(id);
  const messages = messagePages?.pages
    .slice()
    .reverse()
    .flatMap((page) => page.messages);
  const { data: activeMembers } = useGetActiveGroupMembers(id);
  const { data: groupMembers } = useGetGroupMembers(id);
  const memberLookup = useMemo(
    () => new Map(groupMembers?.map((m) => [m.memberId.id, m.memberId])),
    [groupMembers],
  );
  const { mutate: deleteMessage } = useDeleteMessageInGroupMutation(id);
  const { mutate: editMessage } = useEditMessageInGroupMutation(id);
  const { mutate: reactToMessage } = useReactToGroupMessageMutation(id);
  const typingUsers = useTypingIndicator(id);

  useEffect(() => {
    const invalidateIfCurrentGroup = (payload: { groupId: string }) => {
      if (payload.groupId === id) {
        queryClient.invalidateQueries({ queryKey: ["group-messages", id] });
      }
    };
    socket.on("newGroupMessage", invalidateIfCurrentGroup);
    socket.on("messageEdited", invalidateIfCurrentGroup);
    socket.on("messageDeleted", invalidateIfCurrentGroup);
    socket.on("groupReactionAdded", invalidateIfCurrentGroup);
    socket.on("groupReactionRemoved", invalidateIfCurrentGroup);
    return () => {
      socket.off?.("newGroupMessage", invalidateIfCurrentGroup);
      socket.off?.("messageEdited", invalidateIfCurrentGroup);
      socket.off?.("messageDeleted", invalidateIfCurrentGroup);
      socket.off?.("groupReactionAdded", invalidateIfCurrentGroup);
      socket.off?.("groupReactionRemoved", invalidateIfCurrentGroup);
    };
  }, [socket, queryClient, id]);

  useEffect(() => {
    socket.emit("view_conversation", id, user.id);
    seeNewMessages();
    return () => {
      socket.emit("leave_conversation", id, user.id);
    };
  }, [socket, seeNewMessages, user, id]);

  return (
    <section className="flex h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-2xl border border-border md:h-[calc(100dvh-4rem)]">
      {isPendingGroup ? (
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
        group && (
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
            <button
              type="button"
              onClick={() => setGroupImageOpen(true)}
              className="shrink-0 cursor-pointer"
            >
              {group.coverImageUrl ? (
                <img
                  src={group.coverImageUrl}
                  alt={group.name}
                  className="size-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold">
                  {group.name}
                </h1>
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {group.visibility === "public" ? "Public" : "Private"}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {activeMembers?.length ?? 0} active
              </p>
            </div>
            <GroupMenuModal />
          </div>
        )
      )}

      {isPendingMessages ? (
        <div className="flex-1" />
      ) : (
        <MessageThread
          messages={messages}
          currentUserId={user.id}
          variant="group"
          memberLookup={memberLookup}
          onDelete={deleteMessage}
          onEdit={(messageId, newContent) =>
            editMessage({ id: messageId, newContent })
          }
          onReact={(messageId, emoji) =>
            reactToMessage({ id: messageId, emoji })
          }
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}

      <TypingIndicator typingUsers={typingUsers} variant="group" />
      <MessageInput variant="group" id={id as string} />

      <ProfileImageModal
        open={groupImageOpen}
        onClose={() => setGroupImageOpen(false)}
        entityType="group"
        currentImageUrl={group?.coverImageUrl}
      />
    </section>
  );
};

export default Group;
