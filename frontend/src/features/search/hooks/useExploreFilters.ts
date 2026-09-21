import { useUrlFilters, type UrlFilterConfig } from "@/hooks/useUrlFilters";

export type TabKey = "all" | "people" | "posts" | "groups";

export const NEWS_TOPICS = [
  "science",
  "technology",
  "sports",
  "politics",
  "business",
  "entertainment",
  "education",
];

export type ExploreFilters = {
  q: string;
  tab: TabKey;
  topic: string | null;
};

const TAB_KEYS: TabKey[] = ["all", "people", "posts", "groups"];

const EXPLORE_FILTERS_CONFIG: UrlFilterConfig<ExploreFilters> = {
  q: {
    default: "",
    parse: (value) => value ?? "",
  },
  tab: {
    default: "all",
    parse: (value) =>
      TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : "all",
  },
  topic: {
    default: null,
    parse: (value) => (value && NEWS_TOPICS.includes(value) ? value : null),
  },
};

/**
 * Explore's search/browse state (query, active tab, news topic), synced to
 * the URL so a view can be shared or bookmarked and reopened as-is.
 */
export const useExploreFilters = () => useUrlFilters(EXPLORE_FILTERS_CONFIG);
