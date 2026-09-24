import { useMemo, useState } from "react";
import { View, Text, FlatList, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { EventSummary } from "@universe/shared";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useDebounce } from "@hooks/useDebounce";
import { useHideTabBarOnScroll } from "@hooks/useHideTabBarOnScroll";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import ThemedView from "@components/ThemedView";
import SelectChip from "@components/SelectChip";
import SearchInput from "@components/SearchInput";
import EventCard from "@components/events/EventCard";
import EventCardSkeleton from "@components/events/EventCardSkeleton";
import { PressableScale } from "@lib/styled";
import {
  useDiscoverEventsInfiniteQuery,
  useMyEventsInfiniteQuery,
  type MyEventsScope,
} from "@queryAndMutation/queries/event-queries";

const SKELETON_COUNT = 3;

type EventsTab = "discover" | MyEventsScope;

const TABS: { key: EventsTab; label: string }[] = [
  { key: "discover", label: "Discover" },
  { key: "hosting", label: "Hosting" },
  { key: "going", label: "Going" },
  { key: "interested", label: "Interested" },
  { key: "waitlisted", label: "Waitlisted" },
];

// Same discover/hosting/going/interested/waitlisted split as web's
// EventsPage.tsx, adapted to mobile's chip-row tab convention (SelectChip)
// instead of a shadcn Tabs strip.
const EventsScreen = () => {
  const handleTabBarScroll = useHideTabBarOnScroll();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const [activeTab, setActiveTab] = useState<EventsTab>("discover");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const q = debouncedSearch.trim() || undefined;

  const discoverQuery = useDiscoverEventsInfiniteQuery(q, activeTab === "discover");
  const hostingQuery = useMyEventsInfiniteQuery("hosting", q, activeTab === "hosting");
  const goingQuery = useMyEventsInfiniteQuery("going", q, activeTab === "going");
  const interestedQuery = useMyEventsInfiniteQuery("interested", q, activeTab === "interested");
  const waitlistedQuery = useMyEventsInfiniteQuery("waitlisted", q, activeTab === "waitlisted");

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

  const events = useMemo(
    () => activeQuery.data?.pages.flatMap((page) => page.events) ?? [],
    [activeQuery.data],
  );

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <View className="gap-4 px-4 pb-4 pt-10">
        <View className="flex-row items-center gap-3">
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 44, height: 44, backgroundColor: Colors.primary }}
          >
            <Ionicons name="calendar" size={IconSizes.xl} color="#ffffff" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-xl font-bold" style={{ color: theme.title }}>
              Events
            </Text>
            <Text className="text-xs" style={{ color: theme.text }}>
              Discover what's happening on campus.
            </Text>
          </View>
          <PressableScale
            onPress={() => router.push("/create-event")}
            className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2.5"
            style={{ backgroundColor: Colors.primary }}
          >
            <Ionicons name="add" size={IconSizes.md} color="#ffffff" />
            <Text className="text-xs font-bold" style={{ color: "#ffffff" }}>
              Create
            </Text>
          </PressableScale>
        </View>

        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search events by title"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TABS.map((tab) => (
            <SelectChip
              key={tab.key}
              label={tab.label}
              selected={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList<EventSummary>
        className="flex-1"
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 pb-4">
            <EventCard event={item} />
          </View>
        )}
        ListEmptyComponent={
          activeQuery.isPending ? (
            <View className="gap-4 px-4">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </View>
          ) : activeQuery.isError ? (
            <View
              className="mx-4 items-center gap-2 rounded-2xl border border-dashed p-8"
              style={{ borderColor: theme.borderColor }}
            >
              <Text className="text-sm font-semibold" style={{ color: theme.title }}>
                Couldn't load events
              </Text>
              <Text className="text-center text-xs" style={{ color: theme.tabIconColour }}>
                Check your connection and try again.
              </Text>
              <PressableScale
                onPress={() => activeQuery.refetch()}
                className="mt-2 rounded-full px-4 py-2"
                style={{ borderWidth: 1, borderColor: theme.borderColor }}
              >
                <Text className="text-xs font-semibold" style={{ color: theme.title }}>
                  Try again
                </Text>
              </PressableScale>
            </View>
          ) : (
            <View
              className="mx-4 items-center gap-2 rounded-2xl border border-dashed p-8"
              style={{ borderColor: theme.borderColor }}
            >
              <Ionicons name="calendar-outline" size={IconSizes["2xl"]} color={theme.tabIconColour} />
              <Text className="text-sm font-semibold" style={{ color: theme.title }}>
                {q
                  ? "No matching events"
                  : activeTab === "discover"
                    ? "No events to discover yet"
                    : `No events in "${activeTab}"`}
              </Text>
              {q ? (
                <Text className="text-center text-xs" style={{ color: theme.tabIconColour }}>
                  Try a different title.
                </Text>
              ) : activeTab === "discover" ? (
                <Text className="text-center text-xs" style={{ color: theme.tabIconColour }}>
                  Check back soon.
                </Text>
              ) : null}
            </View>
          )
        }
        ListFooterComponent={
          activeQuery.isFetchingNextPage ? <ActivityIndicator className="py-4" color={Colors.primary} /> : null
        }
        onEndReached={() => {
          if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) activeQuery.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        onScroll={handleTabBarScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      />
    </ThemedView>
  );
};

export default EventsScreen;
