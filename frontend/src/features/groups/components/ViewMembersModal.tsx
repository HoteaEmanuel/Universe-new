import { useState } from "react";
import { useParams } from "react-router-dom";
import { Ban, ShieldCheck } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import SearchInput from "@/components/SearchInput";
import UserListSkeleton from "@/components/UserListSkeleton";
import { useDebounce } from "@/hooks/Debounce";
import { getFullName } from "@/utils/fullName";
import { useAuthStore } from "@/store/authStore";
import {
  useCheckUserIsAdminQuery,
  useGetGroupMembersInfiniteQuery,
} from "@/queryAndMutation/queries/group-queries";
import { usePromoteMemberToAdminMutation } from "@/queryAndMutation/mutations/group-mutation";
import type { ChatUser } from "@/features/chat/types";
import BanGroupMemberDialog from "./BanGroupMemberDialog";
import BannedGroupMembersModal from "./BannedGroupMembersModal";

type ViewMembersModalProps = {
  open: boolean;
  onClose: () => void;
};

const SCROLL_THRESHOLD_PX = 150;

const ViewMembersModal = ({ open, onClose }: ViewMembersModalProps) => {
  const { id: groupId } = useParams();
  const { user } = useAuthStore() as { user: ChatUser };
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetGroupMembersInfiniteQuery(groupId, open, debouncedSearch);
  const groupMembers = data?.pages.flatMap((page) => page.items) ?? [];
  const { data: isAdmin } = useCheckUserIsAdminQuery(groupId, user.id);
  const { mutate: promoteMemberToAdmin, isPending: isPromoting } =
    usePromoteMemberToAdminMutation(groupId);
  const [promotingUserIds, setPromotingUserIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [banTarget, setBanTarget] = useState<{ userId: string; name: string } | null>(
    null,
  );
  const [bannedListOpen, setBannedListOpen] = useState(false);

  const setUserPromoting = (userId: string, pending: boolean) => {
    setPromotingUserIds((current) => {
      const next = new Set(current);
      if (pending) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const handlePromote = (userId: string) => {
    setUserPromoting(userId, true);
    promoteMemberToAdmin(userId, {
      onSettled: () => setUserPromoting(userId, false),
    });
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
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
    <Drawer open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between border-b border-border pr-12 pb-3">
          <DrawerTitle>Group members</DrawerTitle>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setBannedListOpen(true)}>
              Banned users
            </Button>
          )}
        </DrawerHeader>
        <SearchInput
          onChange={setSearch}
          value={search}
          className="shrink-0 px-2"
          placeholder="Search members..."
        />
        <DrawerBody
          className="h-full px-4 pb-4"
          onScroll={handleScroll}
        >
          {isPending && <UserListSkeleton />}
          {!isPending && groupMembers.length === 0 && (
            <p className="pt-8 list-loading-text">
              No members found.
            </p>
          )}
          {!isPending && groupMembers.length > 0 && (
            <ul className="flex flex-col gap-1 pt-1">
              {groupMembers.map((member) => {
                const memberName = getFullName(member.member);
                const isRowPromoting =
                  isPromoting && promotingUserIds.has(member.memberId);

                return (
                  <li key={member.id} className="flex items-start gap-3 p-2">
                    <UserAvatar user={member.member} name={memberName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{memberName}</p>
                      {member.role === "admin" && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldCheck className="size-3" />
                          Admin
                        </p>
                      )}
                    </div>
                    {member.role === "member" && isAdmin && (
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isRowPromoting}
                          onClick={() => handlePromote(member.memberId)}
                        >
                          {isRowPromoting ? "Promoting..." : "Make admin"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setBanTarget({
                              userId: member.memberId,
                              name: memberName,
                            })
                          }
                        >
                          <Ban className="size-3.5" />
                          Ban
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </DrawerBody>
      </DrawerContent>
      <BanGroupMemberDialog
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        groupId={groupId}
        userId={banTarget?.userId}
        userName={banTarget?.name}
      />
      <BannedGroupMembersModal
        open={bannedListOpen}
        onClose={() => setBannedListOpen(false)}
      />
    </Drawer>
  );
};

export default ViewMembersModal;
