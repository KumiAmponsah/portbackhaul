import { useQuery } from "@tanstack/react-query";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  /** Route geometry as [lng, lat] pairs. */
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
}

interface DirectionsResponse {
  routes?: Array<{
    distance: number; // metres
    duration: number; // seconds
    geometry: { coordinates: [number, number][] };
  }>;
}

/**
 * Driving route between two points using the Mapbox Directions API.
 * Returns the road geometry plus distance and duration (Uber/Bolt style).
 */
export function useRoute(origin: LatLng | null, destination: LatLng | null) {
  const enabled = Boolean(origin && destination);

  return useQuery({
    queryKey: [
      "route",
      origin ? `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}` : null,
      destination ? `${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}` : null,
    ],
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async (): Promise<RouteResult | null> => {
      if (!MAPBOX_TOKEN) throw new Error("Mapbox token not configured.");
      if (!origin || !destination) return null;

      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        geometries: "geojson",
        overview: "full",
        alternatives: "false",
      });

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Directions failed (${response.status}).`);

      const data = (await response.json()) as DirectionsResponse;
      const route = data.routes?.[0];
      if (!route) return null;

      return {
        coordinates: route.geometry.coordinates,
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMin: Math.max(1, Math.round(route.duration / 60)),
      };
    },
  });
}

/** "95 min" → "1 h 35 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}