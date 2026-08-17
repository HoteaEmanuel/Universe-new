import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findScrollableAncestor } from "@/utils/scroll";
import EventCard from "./components/EventCard";
import CreateEventModal from "./components/CreateEventModal";
import {
  useDiscoverEventsInfiniteQuery,
  useMyEventsInfiniteQuery,
} from "@/queryAndMutation/queries/event-queries";

const SCROLL_FETCH_THRESHOLD = 150;

type EventsTab = "discover" | "hosting" | "going" | "interested" | "waitlisted";

const TABS: { key: EventsTab; label: string }[] = [
  { key: "discover", label: "Discover" },
  { key: "hosting", label: "Hosting" },
  { key: "going", label: "Going" },
  { key: "interested", label: "Interested" },
  { key: "waitlisted", label: "Waitlisted" },
];

const CardSkeleton = () => <Skeleton className="h-40 w-full rounded-2xl" />;

const EmptyState = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
    <CalendarDays className="size-10 text-muted-foreground" />
    <div className="flex flex-col gap-1">
      <p className="font-medium">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  </div>
);

const EventsPage = () => {
  useEffect(() => {
    document.title = "Events";
  }, []);

  const [activeTab, setActiveTab] = useState<EventsTab>("discover");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const discoverQuery = useDiscoverEventsInfiniteQuery(activeTab === "discover");
  const hostingQuery = useMyEventsInfiniteQuery("hosting", activeTab === "hosting");
  const goingQuery = useMyEventsInfiniteQuery("going", activeTab === "going");
  const interestedQuery = useMyEventsInfiniteQuery("interested", activeTab === "interested");
  const waitlistedQuery = useMyEventsInfiniteQuery("waitlisted", activeTab === "waitlisted");

  const activeQuery =
    activeTab === "discover"
      ? discoverQuery
      : activeTab === "hosting"
        ? hostingQuery
        : activeTab === "going"
          ? goingQuery
          : activeTab === "interested"
            ? interestedQuery
            : waitlistedQuery;

  const events = activeQuery.data?.pages.flatMap((page) => page.events) ?? [];
  const { hasNextPage, isFetchingNextPage, fetchNextPage, isPending } = activeQuery;

  // Events doesn't own a scroll container - RootLayout's <section> around the
  // routed page is what actually scrolls - found at runtime the same way
  // CommentsContainer/Explore do, rather than assuming a fixed DOM structure.
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const listRef = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = findScrollableAncestor(node);
  }, []);

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (hasNextPage && !isFetchingNextPage && distanceFromBottom < SCROLL_FETCH_THRESHOLD) {
        fetchNextPage();
      }
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, events.length]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-4 pb-24 md:pb-10">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarDays className="size-5" />
        </span>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground">
            Discover what's happening on campus
          </p>
        </div>
        <Button className="ml-auto gap-1.5" onClick={() => setShowCreateModal(true)}>
          <Plus className="size-4" />
          Create
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value: unknown) => setActiveTab(value as EventsTab)}>
        <TabsList className="flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {activeTab === tab.key && (
              <div ref={listRef} className="flex flex-col gap-4">
                {isPending && (
                  <>
                    <CardSkeleton />
                    <CardSkeleton />
                  </>
                )}
                {!isPending && events.length === 0 && (
                  <EmptyState
                    title={
                      tab.key === "discover"
                        ? "No events to discover yet"
                        : `No events in "${tab.label}"`
                    }
                    subtitle={
                      tab.key === "discover"
                        ? "Check back soon, or create your own."
                        : undefined
                    }
                  />
                )}
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
                {isFetchingNextPage && <CardSkeleton />}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateEventModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
};

export default EventsPage;
