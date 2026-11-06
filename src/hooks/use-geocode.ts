import { useQuery } from "@tanstack/react-query";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export interface GeocodeResult {
  /** Stable Mapbox feature id. */
  id: string;
  /** Short primary line, e.g. "Kumasi". */
  name: string;
  /** Full address line, e.g. "Kumasi, Ashanti, Ghana". */
  placeName: string;
  lat: number;
  lng: number;
}

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

interface MapboxResponse {
  features: MapboxFeature[];
}

/**
 * Forward geocoding — "Kumasi" → [{ name, placeName, lat, lng }, ...]
 *
 * Uses Mapbox Geocoding v5. The `country=gh` bias makes Ghanaian results
 * rank first, but other countries still appear for cross-border routes.
 */
export function useGeocode(query: string, options?: { limit?: number; enabled?: boolean }) {
  const trimmed = query.trim();
  const enabled = (options?.enabled ?? true) && trimmed.length >= 3;

  return useQuery({
    queryKey: ["geocode", trimmed, options?.limit ?? 6],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<GeocodeResult[]> => {
      if (!MAPBOX_TOKEN) throw new Error("Mapbox token not configured.");

      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: "gh",
        limit: String(options?.limit ?? 6),
        types: "place,locality,region,country,address,poi",
      });

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        trimmed,
      )}.json?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Geocoding failed (${response.status}).`);
      }
      const data = (await response.json()) as MapboxResponse;

      return (data.features ?? []).map((f) => ({
        id: f.id,
        name: f.text,
        placeName: f.place_name,
        lat: f.center[1],
        lng: f.center[0],
      }));
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Reverse geocoding                                                  */
/* ------------------------------------------------------------------ */

function toResult(f: MapboxFeature): GeocodeResult {
  return {
    id: f.id,
    name: f.text,
    placeName: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
  };
}

/** Distance in metres between two lat/lng points. */
function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function reverseRequest(
  lat: number,
  lng: number,
  types: string,
  limit: number,
): Promise<MapboxFeature[]> {
  if (!MAPBOX_TOKEN) throw new Error("Mapbox token not configured.");

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    limit: String(limit),
    types,
  });
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = (await response.json()) as { features?: MapboxFeature[] };
  return data.features ?? [];
}

/**
 * Generic reverse geocoding for one or more types (limit is 1 because Mapbox
 * only allows multiple results when a single type is requested).
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  types = "address,neighborhood,locality,place",
): Promise<GeocodeResult | null> {
  const features = await reverseRequest(lat, lng, types, 1);
  return features[0] ? toResult(features[0]) : null;
}

/**
 * Nearest named place of interest (hotel, church, port, shop…) within
 * `maxMeters` of the point. Returns null when nothing is close enough.
 */
export async function reverseGeocodeNearestPoi(
  lat: number,
  lng: number,
  maxMeters = 120,
): Promise<GeocodeResult | null> {
  // A single type lets Mapbox return several candidates.
  const features = await reverseRequest(lat, lng, "poi", 5);
  let best: { feature: MapboxFeature; dist: number } | null = null;

  for (const f of features) {
    const dist = haversineMeters(lat, lng, f.center[1], f.center[0]);
    if (dist <= maxMeters && (!best || dist < best.dist)) {
      best = { feature: f, dist };
    }
  }
  return best ? toResult(best.feature) : null;
}