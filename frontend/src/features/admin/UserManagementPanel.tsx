import { useEffect, useRef, useState } from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { useGetUsersInfiniteQuery } from "@/queryAndMutation/queries/admin-queries";
import { useUnblockUserMutation } from "@/queryAndMutation/mutations/admin-mutation";
import type { AdminUser } from "@/store/adminStore";
import UserAvatar from "@/components/UserAvatar";
import UserListSkeleton from "@/components/UserListSkeleton";
import SearchInput from "@/components/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/Debounce";
import { getFullName } from "@/utils/fullName";
import { formatToLocalDate } from "@/utils/formatDatetoLocal";
import BlockUserDialog from "./BlockUserDialog";
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

const SCROLL_FETCH_THRESHOLD = 150;

const UserManagementPanel = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<AdminUser | null>(null);

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetUsersInfiniteQuery(debouncedSearch);
  const { mutate: unblockUser, isPending: isUnblocking, variables: unblockingId } =
    useUnblockUserMutation();

  const listRef = useRef<HTMLDivElement>(null);
  const users = data?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    const scrollEl = listRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (
        hasNextPage &&
        !isFetchingNextPage &&
        distanceFromBottom < SCROLL_FETCH_THRESHOLD
      ) {
        fetchNextPage();
      }
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, users.length]);

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search users by name or username..."
      />

      <div ref={listRef} className="flex max-h-[65vh] flex-col overflow-y-auto" aria-live="polite">
        {isPending && <UserListSkeleton count={6} lines={2} />}

        {isError && (
          <button className="rounded-lg bg-destructive/8 p-6 text-sm font-semibold" onClick={() => refetch()}>
            Users could not be loaded. Try again.
          </button>
        )}

        {!isPending && users.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {debouncedSearch ? "No matching users found." : "No users found."}
          </p>
        )}

        {!isPending && users.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {users.map((user) => {
              const isBlocked = user.accountStatus?.status === "blocked";
              const displayName = getFullName(user);
              return (
                <li
                  key={user.id}
                  className="flex flex-col items-stretch gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <UserAvatar user={user} name={displayName} className="size-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{displayName}</p>
                      <Badge variant={isBlocked ? "destructive" : "muted"}>
                        {isBlocked ? "Blocked" : "Active"}
                      </Badge>
                      {user.role === "admin" && <Badge variant="brand">Admin</Badge>}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      @{user.username} · {user.email}
                      {user.createdAt &&
                        ` · Joined ${formatToLocalDate(new Date(user.createdAt))}`}
                    </p>
                    {isBlocked && user.accountStatus?.reason && (
                      <p className="mt-0.5 truncate text-xs text-destructive">
                        Reason: {user.accountStatus.reason}
                      </p>
                    )}
                  </div>

                  {user.role !== "admin" &&
                    (isBlocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUnblocking && unblockingId === user.id}
                        onClick={() => setUnblockTarget(user)}
                      >
                        <ShieldCheck className="size-4" />
                        {isUnblocking && unblockingId === user.id
                          ? "Unblocking..."
                          : "Unblock"}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBlockTarget(user)}
                      >
                        <ShieldOff className="size-4" />
                        Block
                      </Button>
                    ))}
                </li>
              );
            })}
          </ul>
        )}

        {isFetchingNextPage && (
          <div className="flex items-center gap-3 py-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}

        {hasNextPage && !isFetchingNextPage && (
          <Button variant="outline" className="mt-3 self-center" onClick={() => fetchNextPage()}>
            Load more users
          </Button>
        )}
      </div>

      <BlockUserDialog
        open={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        userId={blockTarget?.id}
        userName={blockTarget ? getFullName(blockTarget) : undefined}
      />
      <AlertDialog open={!!unblockTarget} onOpenChange={(open: boolean) => !open && !isUnblocking && setUnblockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {unblockTarget ? getFullName(unblockTarget) : "this user"}?</AlertDialogTitle>
            <AlertDialogDescription>They will be able to sign in again. The previous block reason will no longer restrict access.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnblocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUnblocking || !unblockTarget}
              onClick={() => unblockTarget && unblockUser(unblockTarget.id, { onSuccess: () => setUnblockTarget(null) })}
            >
              {isUnblocking ? "Unblocking..." : "Unblock user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementPanel;
