import { useUrlFilters, type UrlFilterConfig } from "@/hooks/useUrlFilters";
import type { OpportunityType, WorkplaceType } from "@/queryAndMutation/types";

export type OpportunityStatus = "active" | "expired" | "all";
export type OpportunitySort = "newest" | "deadline";

export type OpportunitiesFilters = {
  q: string;
  opportunityType: OpportunityType | undefined;
  workplaceType: WorkplaceType | undefined;
  status: OpportunityStatus;
  sort: OpportunitySort;
  savedOnly: boolean;
};

const OPPORTUNITY_TYPES: OpportunityType[] = [
  "internship",
  "part_time",
  "full_time",
  "graduate_program",
  "volunteering",
  "campus_ambassador",
];

const WORKPLACE_TYPES: WorkplaceType[] = ["onsite", "hybrid", "remote"];
const STATUSES: OpportunityStatus[] = ["active", "expired", "all"];
const SORTS: OpportunitySort[] = ["newest", "deadline"];

const OPPORTUNITIES_FILTERS_CONFIG: UrlFilterConfig<OpportunitiesFilters> = {
  q: {
    default: "",
    parse: (value) => value ?? "",
  },
  opportunityType: {
    default: undefined,
    parse: (value) =>
      OPPORTUNITY_TYPES.includes(value as OpportunityType)
        ? (value as OpportunityType)
        : undefined,
  },
  workplaceType: {
    default: undefined,
    parse: (value) =>
      WORKPLACE_TYPES.includes(value as WorkplaceType)
        ? (value as WorkplaceType)
        : undefined,
  },
  status: {
    default: "active",
    parse: (value) =>
      STATUSES.includes(value as OpportunityStatus)
        ? (value as OpportunityStatus)
        : "active",
  },
  sort: {
    default: "newest",
    parse: (value) =>
      SORTS.includes(value as OpportunitySort) ? (value as OpportunitySort) : "newest",
  },
  savedOnly: {
    default: false,
    parse: (value) => value === "true",
    serialize: (value) => (value ? "true" : null),
  },
};

/**
 * Opportunities board search/filter state (query, opportunity type,
 * workplace type, status, sort, saved-only), synced to the URL so a view
 * can be shared or bookmarked and reopened as-is.
 */
export const useOpportunitiesFilters = () =>
  useUrlFilters(OPPORTUNITIES_FILTERS_CONFIG);
