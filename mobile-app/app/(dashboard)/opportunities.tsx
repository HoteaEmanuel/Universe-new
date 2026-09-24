import { useMemo, useRef, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Post } from "@universe/shared";
import { useDebounce } from "@hooks/useDebounce";
import { useAppColorScheme } from "@hooks/useAppColorScheme";
import { useHideTabBarOnScroll } from "@hooks/useHideTabBarOnScroll";
import { Colors } from "@constants/colors";
import { IconSizes } from "@constants/iconSizes";
import ThemedView from "@components/ThemedView";
import SearchInput from "@components/SearchInput";
import PostCard from "@components/post/PostCard";
import OpportunityCardSkeleton from "@components/opportunities/OpportunityCardSkeleton";
import FiltersSheet, {
  DEFAULT_OPPORTUNITIES_FILTERS,
  type FiltersSheetHandle,
  type OpportunitiesFilterState,
} from "@components/opportunities/FiltersSheet";
import { PressableScale } from "@lib/styled";
import { useOpportunitiesInfiniteQuery } from "@queryAndMutation/queries/post-queries";

const SKELETON_COUNT = 3;

const countActiveFilters = (filters: OpportunitiesFilterState) => {
  let count = 0;
  if (filters.opportunityType) count += 1;
  if (filters.workplaceType) count += 1;
  if (filters.status !== DEFAULT_OPPORTUNITIES_FILTERS.status) count += 1;
  if (filters.sort !== DEFAULT_OPPORTUNITIES_FILTERS.sort) count += 1;
  if (filters.savedOnly) count += 1;
  return count;
};

const OpportunitiesScreen = () => {
  const handleTabBarScroll = useHideTabBarOnScroll();
  const colorScheme = useAppColorScheme();
  const theme = colorScheme === "light" ? Colors.light : Colors.dark;
  const sheetRef = useRef<FiltersSheetHandle>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [filters, setFilters] = useState<OpportunitiesFilterState>(DEFAULT_OPPORTUNITIES_FILTERS);
  const activeFilterCount = countActiveFilters(filters);

  const queryFilters = useMemo(
    () => ({ q: debouncedSearch.trim(), ...filters }),
    [debouncedSearch, filters],
  );
  const query = useOpportunitiesInfiniteQuery(queryFilters);
  const posts = useMemo(() => query.data?.pages.flatMap((page) => page.posts) ?? [], [query.data]);

  return (
    <ThemedView safe fullHeight style={{ paddingBottom: 0 }}>
      <View className="gap-4 px-4 pb-4 pt-10">
        <View
          className="flex-row items-start gap-3 rounded-2xl p-4"
          style={{ backgroundColor: colorScheme === "light" ? "#6849a70f" : "#6849a71a" }}
        >
          <View
            className="items-center justify-center rounded-full"
            style={{ width: 44, height: 44, backgroundColor: Colors.primary }}
          >
            <Ionicons name="briefcase" size={IconSizes.xl} color="#ffffff" />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-xl font-bold" style={{ color: theme.title }}>
              Jobs & internships
            </Text>
            <Text className="text-xs" style={{ color: theme.text }}>
              Discover opportunities from verified organizations and apply on the employer's site.
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2.5">
          <View className="flex-1">
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search roles, companies, skills"
            />
          </View>
          <PressableScale
            onPress={() => sheetRef.current?.present()}
            className="flex-row items-center gap-1.5 rounded-xl px-3.5 py-2.5"
            style={{
              backgroundColor: activeFilterCount > 0 ? Colors.primary : theme.uiBackground,
              borderWidth: 1,
              borderColor: activeFilterCount > 0 ? Colors.primary : theme.borderColor,
            }}
          >
            <Ionicons
              name="options-outline"
              size={IconSizes.md}
              color={activeFilterCount > 0 ? "#ffffff" : theme.tabIconColour}
            />
            {activeFilterCount > 0 ? (
              <Text className="text-xs font-bold" style={{ color: "#ffffff" }}>
                {activeFilterCount}
              </Text>
            ) : null}
          </PressableScale>
        </View>
      </View>

      <FlatList<Post>
        className="flex-1"
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-4 pb-4">
            <PostCard post={item} />
          </View>
        )}
        ListEmptyComponent={
          query.isPending ? (
            <View className="gap-4 px-4">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <OpportunityCardSkeleton key={i} />
              ))}
            </View>
          ) : query.isError ? (
            <View
              className="mx-4 items-center gap-2 rounded-2xl border border-dashed p-8"
              style={{ borderColor: theme.borderColor }}
            >
              <Text className="text-sm font-semibold" style={{ color: theme.title }}>
                Couldn't load opportunities
              </Text>
              <Text className="text-center text-xs" style={{ color: theme.tabIconColour }}>
                Check your connection and try again.
              </Text>
              <PressableScale
                onPress={() => query.refetch()}
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
              <Ionicons name="briefcase-outline" size={IconSizes["2xl"]} color={theme.tabIconColour} />
              <Text className="text-sm font-semibold" style={{ color: theme.title }}>
                No matching opportunities
              </Text>
              <Text className="text-center text-xs" style={{ color: theme.tabIconColour }}>
                Try a broader search or clear one of the filters.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator className="py-4" color={Colors.primary} /> : null
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        onScroll={handleTabBarScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
      />

      <FiltersSheet ref={sheetRef} filters={filters} onApply={setFilters} />
    </ThemedView>
  );
};

export default OpportunitiesScreen;
