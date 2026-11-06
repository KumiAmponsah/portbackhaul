import { Loader2, Route as RouteIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Marker, Source, type MapRef } from "react-map-gl/mapbox";

import { BaseMap, GHANA_CENTER, GHANA_ZOOM } from "@/components/map/BaseMap";
import { formatDuration, type LatLng, type RouteResult } from "@/hooks/use-route";
import { cn } from "@/lib/utils";

/** Bolt-style dark green. */
const ROUTE_GREEN = "#1f6b4a";

export interface RoutePreviewMapProps {
  origin: LatLng | null;
  destination: LatLng | null;
  route?: RouteResult | null;
  loading?: boolean;
  height?: number;
  className?: string;
}

/** Green label bubble with a small pointer, sitting above a ring dot. */
function TagMarker({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center" aria-label={label}>
      <div className="relative rounded-md bg-[#1f6b4a] px-2.5 py-1 text-xs font-bold text-white shadow-md">
        {label}
        <span
          aria-hidden
          className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#1f6b4a]"
        />
      </div>
      <span
        aria-hidden
        className="mt-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#1f6b4a] bg-white shadow"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#1f6b4a]" />
      </span>
    </div>
  );
}

export function RoutePreviewMap({
  origin,
  destination,
  route,
  loading = false,
  height = 320,
  className,
}: RoutePreviewMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [loaded, setLoaded] = useState(false);

  const hasRoad = Boolean(route && route.coordinates.length > 1);

  // The line connecting both chosen points. Uses the real road geometry when
  // available, otherwise a straight dashed line so the link is always visible.
  const lineGeoJson = useMemo<GeoJSON.Feature<GeoJSON.LineString> | null>(() => {
    if (hasRoad && route) {
      return {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: route.coordinates },
      };
    }
    if (origin && destination) {
      return {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat],
          ],
        },
      };
    }
    return null;
  }, [hasRoad, route, origin, destination]);

  // Fit the camera so both points and the whole line are visible.
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    if (!map) return;

    const pts: [number, number][] =
      hasRoad && route
        ? route.coordinates
        : ([origin, destination].filter(Boolean) as LatLng[]).map((p) => [p.lng, p.lat]);

    if (pts.length === 0) return;

    if (pts.length === 1) {
      map.flyTo({ center: pts[0], zoom: 14, duration: 800 });
      return;
    }

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const [lng, lat] of pts) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      // Extra top padding so the Pickup/Dropoff tags are never cut off.
      { padding: { top: 90, bottom: 60, left: 50, right: 50 }, duration: 800, maxZoom: 16 },
    );
  }, [loaded, hasRoad, route, origin, destination]);

  const initialCenter = origin ?? destination ?? GHANA_CENTER;
  const initialZoom = origin || destination ? 13 : GHANA_ZOOM;
  const missingBoth = !origin && !destination;
  const missingOne = (!origin || !destination) && !missingBoth;

  return (
    <div className={cn("relative", className)}>
      <BaseMap
        ref={mapRef}
        center={initialCenter}
        zoom={initialZoom}
        height={height}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapProps={{ onLoad: () => setLoaded(true) }}
      >
        {lineGeoJson ? (
          <Source id="route-source" type="geojson" data={lineGeoJson}>
            {/* white casing under the line */}
            <Layer
              id="route-casing"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": "#ffffff",
                "line-width": hasRoad ? 10 : 7,
                "line-opacity": 0.95,
              }}
            />
            <Layer
              id="route-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={
                hasRoad
                  ? { "line-color": ROUTE_GREEN, "line-width": 5 }
                  : {
                      "line-color": ROUTE_GREEN,
                      "line-width": 4,
                      "line-dasharray": [1.5, 1.5],
                    }
              }
            />
          </Source>
        ) : null}

        {origin ? (
          <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom" offset={[0, 8]}>
            <TagMarker label="Pickup" />
          </Marker>
        ) : null}

        {destination ? (
          <Marker
            longitude={destination.lng}
            latitude={destination.lat}
            anchor="bottom"
            offset={[0, 8]}
          >
            <TagMarker label="Dropoff" />
          </Marker>
        ) : null}
      </BaseMap>

      {/* Distance + time chip */}
      {route ? (
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-neutral-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
          <RouteIcon className="h-3.5 w-3.5" aria-hidden />
          {route.distanceKm} km · {formatDuration(route.durationMin)}
        </div>
      ) : null}

      {loading ? (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/95 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-md">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding route…
        </div>
      ) : null}

      {missingBoth || missingOne ? (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground/85 px-3 py-1.5 text-xs font-medium text-background shadow-md">
          {missingBoth
            ? "Pick an origin and a destination to see the route"
            : !origin
              ? "Pick an origin to see the route"
              : "Pick a destination to see the route"}
        </div>
      ) : null}
    </div>
  );
}