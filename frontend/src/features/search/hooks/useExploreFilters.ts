import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

const DEFAULT_FILTERS: ExploreFilters = {
  q: "",
  tab: "all",
  topic: null,
};

const TAB_KEYS: TabKey[] = ["all", "people", "posts", "groups"];

const parseTab = (value: string | null): TabKey =>
  TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : DEFAULT_FILTERS.tab;

const parseTopic = (value: string | null): string | null =>
  value && NEWS_TOPICS.includes(value) ? value : DEFAULT_FILTERS.topic;

const readFilters = (params: URLSearchParams): ExploreFilters => ({
  q: params.get("q") ?? DEFAULT_FILTERS.q,
  tab: parseTab(params.get("tab")),
  topic: parseTopic(params.get("topic")),
});

/**
 * Explore's search/browse state (query, active tab, news topic), synced to
 * the URL so a view can be shared or bookmarked and reopened as-is.
 */
export const useExploreFilters = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<ExploreFilters>) => {
      const current = new URLSearchParams(window.location.search);
      const merged = { ...readFilters(current), ...patch };
      const next = new URLSearchParams(current);

      (Object.keys(DEFAULT_FILTERS) as (keyof ExploreFilters)[]).forEach(
        (key) => {
          const value = merged[key];
          if (value === null || value === DEFAULT_FILTERS[key]) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        },
      );

      navigate({ search: next.toString() }, { replace: true });
    },
    [navigate],
  );

  return { filters, setFilters };
};
