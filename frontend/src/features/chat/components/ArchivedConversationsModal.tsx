import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetArchivedConversations } from "@/queryAndMutation/queries/conversation-queries";
import { useUnarchiveConversationMutation } from "@/queryAndMutation/mutations/conversation-mutation";
import { useAuthStore } from "@/store/authStore";
import ConversationListItem from "./ConversationListItem";
import type { ChatUser } from "../types";

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
  const { data: conversations, isPending } = useGetArchivedConversations(open);
  const { mutate: unarchiveConversation, isPending: isUnarchiving } =
    useUnarchiveConversationMutation();

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle>Archived conversations</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
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
            </ul>
          ) : (
            <p className="pt-8 text-center text-sm text-muted-foreground">
              No archived conversations.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ArchivedConversationsModal;
