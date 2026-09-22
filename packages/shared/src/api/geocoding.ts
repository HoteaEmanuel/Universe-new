// Location search, shared between web and mobile. Hits Komoot's public
// Photon geocoder directly (same one frontend/src/queryAndMutation/queries/location-queries.ts
// already used) rather than going through our own backend — there's nothing
// for our API to add here, and it saves standing up a proxy route. Built on
// the global `fetch`, available on both platforms, instead of axios: unlike
// the web app's shared axios instance (which defaults to
// `withCredentials: true` for cookie auth and needs a separate
// no-credentials instance to satisfy Photon's wildcard CORS policy), a bare
// `fetch` call sends no credentials by default, so there's nothing to opt out
// of on either platform.

const PHOTON_SEARCH_URL = "https://photon.komoot.io/api";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";

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
  const parts = [properties.name, properties.city, properties.state, properties.country].filter(
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

export const searchLocations = async (query: string): Promise<LocationResult[]> => {
  const trimmed = query.trim();
  const url = `${PHOTON_SEARCH_URL}?q=${encodeURIComponent(trimmed)}&limit=5`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Location search failed (${response.status})`);
  return toLocationResults((await response.json()) as PhotonResponse);
};

export const reverseGeocodeLocation = async (lat: number, lon: number): Promise<string | null> => {
  const url = `${PHOTON_REVERSE_URL}?lat=${lat}&lon=${lon}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Reverse geocode failed (${response.status})`);
  const [result] = toLocationResults((await response.json()) as PhotonResponse);
  return result?.label ?? null;
};
