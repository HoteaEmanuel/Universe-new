import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateDetailed } from "@/utils/formatDate";
import { getFullName } from "@/utils/fullName";
import { useGetBlockedUsers } from "@/queryAndMutation/queries/block-queries";
import { useUnblockUserMutation } from "@/queryAndMutation/mutations/block-mutation";

type BlockedUsersModalProps = {
  open: boolean;
  onClose: () => void;
};

const BlockedUserSkeletonRow = () => (
  <li className="flex items-center gap-3 p-2">
    <Skeleton className="size-11 shrink-0 rounded-full" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-28" />
    </div>
    <Skeleton className="h-7 w-16 shrink-0" />
  </li>
);

const BlockedUsersModal = ({ open, onClose }: BlockedUsersModalProps) => {
  const { data: blockedUsers, isPending } = useGetBlockedUsers(open);
  const { mutate: unblockUser } = useUnblockUserMutation();
  const [pendingUnblockIds, setPendingUnblockIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleUnblock = (userId: string) => {
    setPendingUnblockIds((current) => new Set(current).add(userId));
    unblockUser(userId, {
      onSettled: () =>
        setPendingUnblockIds((current) => {
          const next = new Set(current);
          next.delete(userId);
          return next;
        }),
    });
  };

  return (
    <Drawer open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DrawerContent>
        <DrawerHeader className="border-b border-border pr-12 pb-3">
          <DrawerTitle>Blocked users</DrawerTitle>
        </DrawerHeader>
        <DrawerBody className="px-4 pb-4">
          {isPending ? (
            <ul className="flex flex-col gap-1 pt-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <BlockedUserSkeletonRow key={index} />
              ))}
            </ul>
          ) : blockedUsers && blockedUsers.length > 0 ? (
            <ul className="flex flex-col gap-1 pt-1">
              {blockedUsers.map((block) => {
                const isUnblocking = pendingUnblockIds.has(block.user.id);
                return (
                  <li key={block.id} className="flex items-center gap-3 p-2">
                    <UserAvatar user={block.user} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {getFullName(block.user)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Blocked {formatDateDetailed(block.createdAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUnblocking}
                      onClick={() => handleUnblock(block.user.id)}
                    >
                      {isUnblocking ? "Unblocking..." : "Unblock"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="pt-8 list-loading-text">
              No blocked users.
            </p>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default BlockedUsersModal;
