import { useState } from "react";
import { Ban } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import { getFullName } from "@/utils/fullName";
import { useGetEventParticipantsInfiniteQuery } from "@/queryAndMutation/queries/event-queries";
import type {
  EventParticipantCounts,
  EventParticipantStatus,
} from "@/queryAndMutation/types";
import BanEventParticipantDialog from "./BanEventParticipantDialog";
import EventBannedUsersModal from "./EventBannedUsersModal";
import SearchInput from "@/components/SearchInput";
import UserListSkeleton from "@/components/UserListSkeleton";
import { useDebounce } from "@/hooks/Debounce";

type EventParticipantsModalProps = {
  open: boolean;
  onClose: () => void;
  eventId?: string;
  isHost: boolean;
  counts?: EventParticipantCounts;
};

const SCROLL_THRESHOLD_PX = 150;

const STATUS_TABS: { key: EventParticipantStatus; label: string }[] = [
  { key: "going", label: "Going" },
  { key: "interested", label: "Interested" },
  { key: "waitlisted", label: "Waitlisted" },
];

type ParticipantsStatusListProps = {
  eventId?: string;
  status: EventParticipantStatus;
  enabled: boolean;
  search: string;
  isHost: boolean;
  onBanTarget: (target: { userId: string; name: string }) => void;
};

const ParticipantsStatusList = ({
  eventId,
  status,
  enabled,
  search,
  isHost,
  onBanTarget,
}: ParticipantsStatusListProps) => {
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetEventParticipantsInfiniteQuery(eventId, status, enabled, search);

  const participants = data?.pages.flatMap((page) => page.items) ?? [];

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
    <DrawerBody className="h-full px-4 pb-4" onScroll={handleScroll}>
      {isPending && <UserListSkeleton lines={2} />}
      {!isPending && participants.length === 0 && (
        <p className="pt-8 list-loading-text">No participants yet.</p>
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
                      onBanTarget({
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
    </DrawerBody>
  );
};

const EventParticipantsModal = ({
  open,
  onClose,
  eventId,
  isHost,
  counts,
}: EventParticipantsModalProps) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<EventParticipantStatus>("going");

  const debouncedSearch = useDebounce(search, 300);
  const [banTarget, setBanTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [bannedListOpen, setBannedListOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between border-b border-border pr-12 pb-3">
          <DrawerTitle>Participants</DrawerTitle>
          {isHost && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setBannedListOpen(true)}
            >
              Banned users
            </Button>
          )}
        </DrawerHeader>
        <SearchInput
          onChange={setSearch}
          value={search}
          className="shrink-0 px-2"
          placeholder="Search participants..."
        />
        <Tabs
          value={activeTab}
          onValueChange={(value: unknown) =>
            setActiveTab(value as EventParticipantStatus)
          }
          className="flex flex-1 flex-col gap-2 overflow-hidden px-2"
        >
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
                {counts ? ` (${counts[tab.key]})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsContent
              key={tab.key}
              value={tab.key}
              className="min-h-0 flex-1 overflow-hidden"
            >
              <ParticipantsStatusList
                eventId={eventId}
                status={tab.key}
                enabled={open && activeTab === tab.key}
                search={debouncedSearch}
                isHost={isHost}
                onBanTarget={setBanTarget}
              />
            </TabsContent>
          ))}
        </Tabs>
      </DrawerContent>
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
    </Drawer>
  );
};

export default EventParticipantsModal;
