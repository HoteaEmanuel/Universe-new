import { useQuery } from "@tanstack/react-query";
import { searchLocations, reverseGeocodeLocation, type LocationResult } from "@universe/shared/api";

export type { LocationResult };
export { reverseGeocodeLocation };

// Mirrors frontend/src/queryAndMutation/queries/location-queries.ts.
export const useSearchLocationsQuery = (query: string) => {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["locationSearch", trimmed],
    enabled: trimmed.length > 2,
    staleTime: 5 * 60 * 1000,
    queryFn: () => searchLocations(trimmed),
  });
};
