import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const PHOTON_SEARCH_URL = "https://photon.komoot.io/api";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";

// The default axios export has `withCredentials = true` set app-wide for cookie
// auth, which browsers reject against Photon's wildcard `Access-Control-Allow-Origin: *`.
const photonClient = axios.create({ withCredentials: false });

type PhotonProperties = {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
  osm_id?: number;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
};

type PhotonResponse = {
  features: PhotonFeature[];
};

export type LocationResult = {
  id: string;
  label: string;
};

const formatLocationLabel = (properties: PhotonProperties) => {
  const parts = [
    properties.name,
    properties.city,
    properties.state,
    properties.country,
  ].filter(
    (part, index, all): part is string => !!part && all.indexOf(part) === index,
  );
  return parts.join(", ");
};

const toLocationResults = (data: PhotonResponse): LocationResult[] =>
  data.features
    .map((feature) => ({
      id: `${feature.properties.osm_id ?? feature.properties.name}-${feature.geometry.coordinates.join(",")}`,
      label: formatLocationLabel(feature.properties),
    }))
    .filter((result) => result.label.length > 0);

export const useSearchLocationsQuery = (query: string) => {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["locationSearch", trimmed],
    enabled: trimmed.length > 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await photonClient.get<PhotonResponse>(PHOTON_SEARCH_URL, {
        params: { q: trimmed, limit: 5 },
      });
      return toLocationResults(response.data);
    },
  });
};

export const reverseGeocodeLocation = async (
  lat: number,
  lon: number,
): Promise<string | null> => {
  const response = await photonClient.get<PhotonResponse>(PHOTON_REVERSE_URL, {
    params: { lat, lon },
  });
  const [result] = toLocationResults(response.data);
  return result?.label ?? null;
};
