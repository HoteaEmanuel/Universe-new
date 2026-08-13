import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SquarePen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "../store/authStore";
import { useGetUserConversations } from "../queryAndMutation/queries/conversation-queries";
import { useGetUserGroups } from "../queryAndMutation/queries/group-queries";
import { getFullName } from "../utils/fullName";
import ConversationListItem from "../features/chat/components/ConversationListItem";
import type { ChatUser, ConversationListEntry } from "../features/chat/types";

const ChatListSkeleton = () => (
  <ul className="flex flex-col gap-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <li key={i} className="flex items-center gap-3 p-2">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-48" />
        </div>
      </li>
    ))}
  </ul>
);

const ChatContainer = () => {
  useEffect(() => {
    document.title = "Chat";
  }, []);

  const navigate = useNavigate();
  const { user, onlineUsers } = useAuthStore() as {
    user: ChatUser;
    onlineUsers: string[];
  };
  const { data: conversations, isPending: isPendingConversations } =
    useGetUserConversations();
  const { data: groups, isPending: isPendingGroups } = useGetUserGroups(
    user.id,
  );
  const [searchTerm, setSearchTerm] = useState("");

  const combined = useMemo<ConversationListEntry[]>(
    () => [...(conversations ?? []), ...(groups ?? [])],
    [conversations, groups],
  );

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return combined;
    return combined.filter((entry) => {
      const title = entry.name ? entry.name : getFullName(entry.user);
      return title.toLowerCase().includes(query);
    });
  }, [combined, searchTerm]);

  const isPending = isPendingConversations || isPendingGroups;

  return (
    <section className="flex h-[calc(100dvh-10rem)] flex-col md:h-[calc(100dvh-4rem)]">
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label="New conversation"
          onClick={() => navigate("/create-conversation")}
        >
          <SquarePen />
        </Button>
      </div>

      <div className="relative pb-4">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search contacts or groups"
          className="pl-8"
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <ChatListSkeleton />
        ) : filtered.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {filtered.map((entry) => (
              <ConversationListItem
                key={entry.id}
                entry={entry}
                currentUserId={user.id}
                isOnline={
                  !entry.name && !!entry.user && onlineUsers.includes(entry.user.id)
                }
                onClick={() =>
                  navigate(
                    entry.name
                      ? `/groups/${entry.id}`
                      : `/conversations/${entry.id}`,
                  )
                }
              />
            ))}
          </ul>
        ) : combined.length > 0 ? (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            No results
          </p>
        ) : (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            No conversations yet
          </p>
        )}
      </div>
    </section>
  );
};

export default ChatContainer;
