import { useState } from "react";
import BannedUsersSheet from "@/features/moderation/components/BannedUsersSheet";
import { useGetEventBansInfiniteQuery } from "@/queryAndMutation/queries/event-queries";
import { useUnbanEventParticipantMutation } from "@/queryAndMutation/mutations/event-mutation";

type EventBannedUsersModalProps = {
  open: boolean;
  onClose: () => void;
  eventId?: string;
};

const EventBannedUsersModal = ({ open, onClose, eventId }: EventBannedUsersModalProps) => {
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
    useGetEventBansInfiniteQuery(eventId, open);
  const { mutate: unbanParticipant } = useUnbanEventParticipantMutation(eventId);
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
    unbanParticipant(userId, { onSettled: () => setUserPending(userId, false) });
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

export default EventBannedUsersModal;
