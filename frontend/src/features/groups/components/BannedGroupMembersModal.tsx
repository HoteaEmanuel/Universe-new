import { useState } from "react";
import { useParams } from "react-router-dom";
import BannedUsersSheet from "@/features/moderation/components/BannedUsersSheet";
import { useGetGroupBansInfinite } from "@/queryAndMutation/queries/group-queries";
import { useUnbanGroupMemberMutation } from "@/queryAndMutation/mutations/group-mutation";

type BannedGroupMembersModalProps = {
  open: boolean;
  onClose: () => void;
};

const BannedGroupMembersModal = ({ open, onClose }: BannedGroupMembersModalProps) => {
  const { id: groupId } = useParams();
  const {
    data,
    isPending,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } =
    useGetGroupBansInfinite(groupId, open);
  const { mutate: unbanMember } = useUnbanGroupMemberMutation(groupId);
  const [pendingUnbanUserIds, setPendingUnbanUserIds] = useState<Set<string>>(
    () => new Set(),
  );

  const bans = data?.pages.flatMap((page) => page.items) ?? [];

  const setUserPending = (userId: string, pending: boolean) => {
    setPendingUnbanUserIds((current) => {
      const next = new Set(current);
      if (pending) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const handleUnban = (userId: string) => {
    setUserPending(userId, true);
    unbanMember(userId, { onSettled: () => setUserPending(userId, false) });
  };

  return (
    <BannedUsersSheet
      open={open}
      onClose={onClose}
      emptyText="No banned users."
      errorText="Couldn't load banned users."
      bans={bans}
      isPending={isPending}
      isError={isError}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      isRetrying={isRefetching}
      pendingUnbanUserIds={pendingUnbanUserIds}
      fetchNextPage={fetchNextPage}
      retry={refetch}
      onUnban={handleUnban}
    />
  );
};

export default BannedGroupMembersModal;
