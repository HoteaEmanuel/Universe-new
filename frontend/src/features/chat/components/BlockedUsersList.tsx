import { useState } from "react";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateDetailed } from "@/utils/formatDate";
import { getFullName } from "@/utils/fullName";
import { useGetBlockedUsers } from "@/queryAndMutation/queries/block-queries";
import { useUnblockUserMutation } from "@/queryAndMutation/mutations/block-mutation";

type BlockedUsersListProps = {
  enabled?: boolean;
  emptyMessage?: string;
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

const BlockedUsersList = ({
  enabled = true,
  emptyMessage = "No blocked users.",
}: BlockedUsersListProps) => {
  const { data: blockedUsers, isPending } = useGetBlockedUsers(enabled);
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

  if (isPending) {
    return (
      <ul className="flex flex-col gap-1 pt-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <BlockedUserSkeletonRow key={index} />
        ))}
      </ul>
    );
  }

  if (!blockedUsers || blockedUsers.length === 0) {
    return <p className="pt-8 list-loading-text">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col gap-1 pt-1">
      {blockedUsers.map((block) => {
        const isUnblocking = pendingUnblockIds.has(block.user.id);
        return (
          <li key={block.id} className="flex items-center gap-3 p-2">
            <UserAvatar user={block.user} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{getFullName(block.user)}</p>
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
  );
};

export default BlockedUsersList;
