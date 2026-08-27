import { useState } from "react";
import { Ban } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { getFullName } from "@/utils/fullName";
import { useGetEventParticipantsInfiniteQuery } from "@/queryAndMutation/queries/event-queries";
import BanEventParticipantDialog from "./BanEventParticipantDialog";
import EventBannedUsersModal from "./EventBannedUsersModal";

type EventParticipantsModalProps = {
  open: boolean;
  onClose: () => void;
  eventId?: string;
  isHost: boolean;
};

const SCROLL_THRESHOLD_PX = 150;

const EventParticipantsModal = ({
  open,
  onClose,
  eventId,
  isHost,
}: EventParticipantsModalProps) => {
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetEventParticipantsInfiniteQuery(eventId, undefined, open);
  const [banTarget, setBanTarget] = useState<{ userId: string; name: string } | null>(
    null,
  );
  const [bannedListOpen, setBannedListOpen] = useState(false);

  const participants = data?.pages.flatMap((page) => page.items) ?? [];

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceFromBottom < SCROLL_THRESHOLD_PX && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-border pb-3">
          <SheetTitle>Participants</SheetTitle>
          {isHost && (
            <Button variant="ghost" size="sm" onClick={() => setBannedListOpen(true)}>
              Banned users
            </Button>
          )}
        </SheetHeader>
        <div
          className="flex-1 overflow-y-auto px-4 pb-4"
          onScroll={handleScroll}
        >
          {isPending && (
            <p className="pt-8 list-loading-text">
              Loading...
            </p>
          )}
          {!isPending && participants.length === 0 && (
            <p className="pt-8 list-loading-text">
              No participants yet.
            </p>
          )}
          {!isPending && participants.length > 0 && (
            <ul className="flex flex-col gap-1 pt-1">
              {participants.map((participant) => {
                const participantName = getFullName(participant.user);

                return (
                  <li key={participant.id} className="flex items-start gap-3 p-2">
                    <UserAvatar user={participant.user} name={participantName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{participantName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {participant.status}
                      </p>
                    </div>
                    {isHost && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="shrink-0"
                        onClick={() =>
                          setBanTarget({
                            userId: participant.userId,
                            name: participantName,
                          })
                        }
                      >
                        <Ban className="size-3.5" />
                        Ban
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
      <BanEventParticipantDialog
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        eventId={eventId}
        userId={banTarget?.userId}
        userName={banTarget?.name}
      />
      <EventBannedUsersModal
        open={bannedListOpen}
        onClose={() => setBannedListOpen(false)}
        eventId={eventId}
      />
    </Sheet>
  );
};

export default EventParticipantsModal;
