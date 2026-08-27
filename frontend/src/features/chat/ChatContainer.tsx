import { useEffect, useState, type UIEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, MoreVertical, ShieldOff, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SearchInput from "@/components/SearchInput";
import { useAuthStore } from "@/store/authStore";
import { useDebounce } from "@/hooks/Debounce";
import { useMergedConversationFeed } from "./hooks/useMergedConversationFeed";
import ConversationListItem from "./components/ConversationListItem";
import ConversationRowMenu from "./components/ConversationRowMenu";
import ArchivedConversationsModal from "./components/ArchivedConversationsModal";
import BlockedUsersModal from "./components/BlockedUsersModal";
import type { ChatUser } from "./types";

const SCROLL_THRESHOLD_PX = 150;

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
  const [searchTerm, setSearchTerm] = useState("");
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 350);

  const { items, isPending, hasMore, isFetchingNextPage, fetchNextPage } =
    useMergedConversationFeed(user.id, debouncedSearch.trim());

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceFromBottom < SCROLL_THRESHOLD_PX && hasMore && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <section className="flex h-[calc(100dvh-10rem)] flex-col md:h-[calc(100dvh-4rem)]">
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            aria-label="New conversation"
            onClick={() => navigate("/create-conversation")}
          >
            <SquarePen />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" aria-label="More options" />}
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="whitespace-nowrap"
                onClick={() => setArchivedOpen(true)}
              >
                <Archive />
                Archived conversations
              </DropdownMenuItem>
              <DropdownMenuItem
                className="whitespace-nowrap"
                onClick={() => setBlockedOpen(true)}
              >
                <ShieldOff />
                Blocked users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search contacts or groups"
        className="mb-4"
      />

      <div className="min-h-0 flex-1 overflow-y-auto" onScroll={handleScroll}>
        {isPending ? (
          <ChatListSkeleton />
        ) : items.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {items.map((entry) => (
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
                trailingAction={
                  !entry.name ? <ConversationRowMenu conversationId={entry.id} /> : undefined
                }
              />
            ))}
            {isFetchingNextPage && (
              <li className="flex items-center gap-3 p-2">
                <Skeleton className="size-14 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3.5 w-48" />
                </div>
              </li>
            )}
          </ul>
        ) : debouncedSearch.trim() ? (
          <p className="pt-10 list-loading-text">
            No results
          </p>
        ) : (
          <p className="pt-10 list-loading-text">
            No conversations yet
          </p>
        )}
      </div>

      <ArchivedConversationsModal
        open={archivedOpen}
        onClose={() => setArchivedOpen(false)}
      />
      <BlockedUsersModal open={blockedOpen} onClose={() => setBlockedOpen(false)} />
    </section>
  );
};

export default ChatContainer;
