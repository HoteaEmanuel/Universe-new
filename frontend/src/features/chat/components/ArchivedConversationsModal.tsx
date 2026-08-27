import { useState, type UIEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import SearchInput from "@/components/SearchInput";
import { useDebounce } from "@/hooks/Debounce";
import { useShowSearchInput } from "@/hooks/useShowSearchInput";
import { useGetArchivedConversationsInfinite } from "@/queryAndMutation/queries/conversation-queries";
import { useUnarchiveConversationMutation } from "@/queryAndMutation/mutations/conversation-mutation";
import { useAuthStore } from "@/store/authStore";
import ConversationListItem from "./ConversationListItem";
import type { ChatUser } from "../types";

const SCROLL_THRESHOLD_PX = 150;

type ArchivedConversationsModalProps = {
  open: boolean;
  onClose: () => void;
};

const ArchivedConversationsModal = ({
  open,
  onClose,
}: ArchivedConversationsModalProps) => {
  const navigate = useNavigate();
  const { user, onlineUsers } = useAuthStore() as {
    user: ChatUser;
    onlineUsers: string[];
  };
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 350);
  const { data, isPending, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useGetArchivedConversationsInfinite(debouncedSearch.trim(), open);
  const conversations = data?.pages.flatMap((page) => page.conversations) ?? [];
  const { mutate: unarchiveConversation, isPending: isUnarchiving } =
    useUnarchiveConversationMutation();
  const showSearch = useShowSearchInput(
    conversations.length,
    !!debouncedSearch.trim(),
    isPending,
  );

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (
      distanceFromBottom < SCROLL_THRESHOLD_PX &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onClose();
      setSearchTerm("");
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader className="border-b border-border pr-12 pb-3">
          <DrawerTitle>Archived conversations</DrawerTitle>
        </DrawerHeader>
        {showSearch && (
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search archived conversations"
            className="shrink-0 px-4"
          />
        )}
        <DrawerBody className="px-4 pb-4" onScroll={handleScroll}>
          {isPending ? (
            <ul className="flex flex-col gap-1 pt-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <li key={index} className="flex items-center gap-3 p-2">
                  <Skeleton className="size-14 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3.5 w-48" />
                  </div>
                </li>
              ))}
            </ul>
          ) : conversations && conversations.length > 0 ? (
            <ul className="flex flex-col gap-1 pt-1">
              {conversations.map((entry) => (
                <ConversationListItem
                  key={entry.id}
                  entry={entry}
                  currentUserId={user.id}
                  isOnline={!!entry.user && onlineUsers.includes(entry.user.id)}
                  onClick={() => {
                    onClose();
                    navigate(`/conversations/${entry.id}`);
                  }}
                  trailingAction={
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUnarchiving}
                      onClick={() => unarchiveConversation(entry.id)}
                    >
                      Unarchive
                    </Button>
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
          ) : (
            <p className="pt-8 list-loading-text">
              {debouncedSearch.trim()
                ? "No results."
                : "No archived conversations."}
            </p>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ArchivedConversationsModal;
