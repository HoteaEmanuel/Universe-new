import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, ShieldOff, ShieldX, User } from "lucide-react";
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
  useBlockUserMutation,
  useUnblockUserMutation,
} from "@/queryAndMutation/mutations/block-mutation";
import { getFullName } from "@/utils/fullName";
import { urlPathName } from "@/utils/urlPathFromName";
import type { ChatUser } from "../types";

type ChatUserMenuProps = {
  user: ChatUser;
  isBlockedByViewer: boolean;
};

const ChatUserMenu = ({ user, isBlockedByViewer }: ChatUserMenuProps) => {
  const navigate = useNavigate();
  const [blockOpen, setBlockOpen] = useState(false);
  const { mutate: blockUser, isPending: isBlocking } = useBlockUserMutation();
  const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUserMutation();

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" aria-label="Conversation options" />}
              />
            }
          >
            <MoreVertical />
          </TooltipTrigger>
          <TooltipContent>Conversation options</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/u/${urlPathName(user)}`)}>
            <User />
            View profile
          </DropdownMenuItem>
          {isBlockedByViewer ? (
            <DropdownMenuItem
              disabled={isUnblocking}
              onClick={() => unblockUser(user.id)}
            >
              <ShieldOff />
              {isUnblocking ? "Unblocking..." : "Unblock user"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem variant="destructive" onClick={() => setBlockOpen(true)}>
              <ShieldX />
              Block user
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {getFullName(user)}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won&apos;t be able to message you anymore. This conversation
              will move out of your chat list. You can unblock them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isBlocking}
              onClick={() =>
                blockUser(user.id, { onSuccess: () => setBlockOpen(false) })
              }
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatUserMenu;
