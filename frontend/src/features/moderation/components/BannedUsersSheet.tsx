import type { UIEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateDetailed } from "@/utils/formatDate";
import { getFullName } from "@/utils/fullName";

const SCROLL_THRESHOLD_PX = 150;

type NameFields = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
};

type BannedUserRecord<TUser extends NameFields> = {
  id: string;
  userId: string;
  reason?: string | null;
  createdAt: string;
  user: TUser;
  bannedBy: TUser | null;
};

type BannedUsersSheetProps<TUser extends NameFields> = {
  open: boolean;
  onClose: () => void;
  title?: string;
  emptyText: string;
  errorText: string;
  bans: BannedUserRecord<TUser>[];
  isPending: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  isRetrying: boolean;
  pendingUnbanUserIds: ReadonlySet<string>;
  fetchNextPage: () => void;
  retry: () => void;
  onUnban: (userId: string) => void;
};

const BannedUserSkeletonRow = () => (
  <li className="flex items-start gap-3 p-2">
    <Skeleton className="size-11 shrink-0 rounded-full" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-44" />
    </div>
    <Skeleton className="h-7 w-16 shrink-0" />
  </li>
);

const BannedUsersSheet = <TUser extends NameFields>({
  open,
  onClose,
  title = "Banned users",
  emptyText,
  errorText,
  bans,
  isPending,
  isError,
  isFetchingNextPage,
  hasNextPage,
  isRetrying,
  pendingUnbanUserIds,
  fetchNextPage,
  retry,
  onUnban,
}: BannedUsersSheetProps<TUser>) => {
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

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
      >
        <SheetHeader className="border-b border-border pb-3">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div
          className="flex-1 overflow-y-auto px-4 pb-4"
          onScroll={handleScroll}
        >
          {isPending && (
            <ul className="flex flex-col gap-1 pt-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <BannedUserSkeletonRow key={index} />
              ))}
            </ul>
          )}
          {!isPending && isError && bans.length === 0 && (
            <div className="flex flex-col items-center gap-3 pt-8 text-center">
              <p className="text-sm text-muted-foreground">{errorText}</p>
              <Button
                size="sm"
                variant="outline"
                disabled={isRetrying}
                onClick={retry}
              >
                <RefreshCw className="size-3.5" />
                {isRetrying ? "Retrying..." : "Retry"}
              </Button>
            </div>
          )}
          {!isPending && !isError && bans.length === 0 && (
            <p className="pt-8 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          )}
          {!isPending && bans.length > 0 && (
            <ul className="flex flex-col gap-1 pt-1">
              {bans.map((ban) => {
                const userName = getFullName(ban.user);
                const bannedByName = ban.bannedBy
                  ? getFullName(ban.bannedBy)
                  : "Unknown moderator";
                const isUnbanning = pendingUnbanUserIds.has(ban.userId);

                return (
                  <li key={ban.id} className="flex items-start gap-3 p-2">
                    <UserAvatar user={ban.user} name={userName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">
                        Banned by {bannedByName} -{" "}
                        {formatDateDetailed(ban.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">
                        {ban.reason ? `Reason: ${ban.reason}` : "No reason provided."}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUnbanning}
                      onClick={() => onUnban(ban.userId)}
                    >
                      {isUnbanning ? "Unbanning..." : "Unban"}
                    </Button>
                  </li>
                );
              })}
              {isFetchingNextPage && <BannedUserSkeletonRow />}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BannedUsersSheet;
