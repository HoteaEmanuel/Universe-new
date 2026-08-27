import { useState } from "react";
import { Archive, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useArchiveConversationMutation,
  useDeleteConversationMutation,
} from "@/queryAndMutation/mutations/conversation-mutation";

type ConversationRowMenuProps = {
  conversationId: string;
};

const ConversationRowMenu = ({ conversationId }: ConversationRowMenuProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutate: archiveConversation } = useArchiveConversationMutation();
  const { mutate: deleteConversation, isPending: isDeleting } =
    useDeleteConversationMutation();

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Conversation options"
                  />
                }
              />
            }
          >
            <MoreVertical className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Conversation options</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => archiveConversation(conversationId)}>
            <Archive />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes it from your list. The other person keeps their
              copy, and it&apos;ll reappear if they message you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={() =>
                deleteConversation(conversationId, {
                  onSuccess: () => setDeleteOpen(false),
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConversationRowMenu;
