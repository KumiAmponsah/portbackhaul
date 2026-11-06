import "mapbox-gl/dist/mapbox-gl.css";

import { forwardRef, useMemo } from "react";
import Map, { type MapProps, type MapRef } from "react-map-gl/mapbox";

import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export const GHANA_CENTER = { lat: 7.9465, lng: -1.0232 };
export const GHANA_ZOOM = 6.5;

export const ACCRA_CENTER = { lat: 5.6037, lng: -0.1870 };
export const ACCRA_ZOOM = 11;

export const DEFAULT_MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
export const LIGHT_MAP_STYLE = "mapbox://styles/mapbox/light-v11";

export interface BaseMapProps {
  /** Initial centre. Defaults to Ghana. */
  center?: { lat: number; lng: number };
  /** Initial zoom. Defaults to Ghana-zoom. */
  zoom?: number;
  /**
   * When provided, the map becomes "controlled" — its centre follows this prop
   * instead of internal state. Use for "fly to location" flows.
   */
  controlledCenter?: { lat: number; lng: number } | null;
  /** When provided with `controlledCenter`, the zoom follows this prop too. */
  controlledZoom?: number | null;
  /** Pixel height of the map. Defaults to 400. */
  height?: number | string;
  /** Mapbox style URL. Defaults to streets-v12. */
  mapStyle?: string;
  className?: string;
  interactive?: boolean;
  children?: React.ReactNode;
  mapProps?: Omit<MapProps, "initialViewState" | "mapboxAccessToken" | "mapStyle">;
}

/**
 * BaseMap
 *
 * A thin wrapper around react-map-gl + Mapbox. In uncontrolled mode it sets
 * initialViewState and lets the user pan/zoom freely. In controlled mode,
 * pass `controlledCenter`/`controlledZoom` and the map snaps to those values.
 *
 * Forward the ref (`ref={mapRef}`) to get the raw Mapbox Map instance — used
 * by the location picker to call `flyTo()` programmatically.
 */
export const BaseMap = forwardRef<MapRef, BaseMapProps>(function BaseMap(
  {
    center = GHANA_CENTER,
    zoom = GHANA_ZOOM,
    controlledCenter = null,
    controlledZoom = null,
    height = 400,
    mapStyle = DEFAULT_MAP_STYLE,
    className,
    interactive = true,
    children,
    mapProps,
  },
  ref,
) {
  const initialViewState = useMemo(
    () => ({
      longitude: center.lng,
      latitude: center.lat,
      zoom,
    }),
    [center.lat, center.lng, zoom],
  );

  const controlledViewState = useMemo(() => {
    if (!controlledCenter) return null;
    return {
      longitude: controlledCenter.lng,
      latitude: controlledCenter.lat,
      zoom: controlledZoom ?? zoom,
    };
  }, [controlledCenter, controlledZoom, zoom]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center",
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm font-bold text-destructive">Map is not configured</p>
        <p className="max-w-md text-xs text-muted-foreground">
          Add <code className="rounded bg-muted px-1 py-0.5">VITE_MAPBOX_TOKEN=pk.…</code> to your{" "}
          <code className="rounded bg-muted px-1 py-0.5">.env</code> file and restart the dev
          server.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg border border-border", className)}
      style={{ height }}
    >
      <Map
        ref={ref}
        {...(controlledViewState
          ? { ...controlledViewState, transitionDuration: 600 }
          : { initialViewState })}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        interactive={interactive}
        attributionControl
        {...mapProps}
      >
        {children}
      </Map>
    </div>
  );
});