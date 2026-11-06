import { Loader2, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Marker, type MapRef } from "react-map-gl/mapbox";

import { BaseMap, GHANA_CENTER, GHANA_ZOOM } from "@/components/map/BaseMap";
import { LocationSearchInput } from "@/components/map/LocationSearchInput";
import { Button } from "@/components/ui/button";
import {
  reverseGeocode,
  reverseGeocodeNearestPoi,
  type GeocodeResult,
} from "@/hooks/use-geocode";

export interface PickedLocation {
  name: string;
  placeName: string;
  lat: number;
  lng: number;
}

export interface LocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PickedLocation | null;
  onConfirm: (location: PickedLocation) => void;
  title?: string;
}

/** How far (in screen pixels) from the pin a map label still counts as "under" it. */
const LABEL_RADIUS_PX = 36;

/** Layers that carry names of places (hotels, churches, ports, stations…). */
const PLACE_LABEL_LAYER = /poi|transit|airport|landmark|natural-point|water-point/i;

/**
 * Reads the name of the label drawn on the map closest to the given point.
 * This is what the user actually sees on the map (e.g. "Hotel Majorie").
 * Synchronous and cheap, so it is safe to call while dragging.
 */
function findMapLabelName(map: MapRef | null, lat: number, lng: number): string | null {
  if (!map) return null;
  const raw = map.getMap();
  if (!raw) return null;

  const point = raw.project([lng, lat]);
  const features = raw.queryRenderedFeatures([
    [point.x - LABEL_RADIUS_PX, point.y - LABEL_RADIUS_PX],
    [point.x + LABEL_RADIUS_PX, point.y + LABEL_RADIUS_PX],
  ]);

  let best: { name: string; dist: number } | null = null;

  for (const f of features) {
    const layerId = f.layer?.id ?? "";
    if (!PLACE_LABEL_LAYER.test(layerId)) continue;
    if (f.geometry.type !== "Point") continue;

    const props = (f.properties ?? {}) as Record<string, unknown>;
    const name = (props.name_en ?? props.name) as string | undefined;
    if (!name) continue;

    const [fLng, fLat] = (f.geometry as GeoJSON.Point).coordinates;
    const p = raw.project([fLng, fLat]);
    const dist = Math.hypot(p.x - point.x, p.y - point.y);

    if (dist <= LABEL_RADIUS_PX && (!best || dist < best.dist)) {
      best = { name, dist };
    }
  }

  return best?.name ?? null;
}

/** Keeps only "City, Region, Country" from a full Mapbox place_name. */
function areaFrom(placeName: string): string {
  return placeName.split(",").map((s) => s.trim()).filter(Boolean).slice(-3).join(", ");
}

export function LocationPicker({
  open,
  onOpenChange,
  initial,
  onConfirm,
  title = "Pick a location",
}: LocationPickerProps) {
  const mapRef = useRef<MapRef | null>(null);
  const requestIdRef = useRef(0);
  const lastDragNameRef = useRef<string>("");

  const [pin, setPin] = useState<PickedLocation | null>(initial ?? null);
  const [searchText, setSearchText] = useState<string>(initial?.placeName ?? "");
  const [resolving, setResolving] = useState<boolean>(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    requestIdRef.current += 1; // invalidate any in-flight lookups
    setPin(initial ?? null);
    setSearchText(initial?.placeName ?? "");
    setResolveError(null);
    setResolving(false);
  }, [open, initial]);

  /**
   * Works out the best name for a point, in this order:
   *  1. the label drawn on the map under/near the pin
   *  2. the nearest named place of interest (within ~120 m)
   *  3. the nearest street address
   *  4. the neighbourhood / town
   */
  const resolvePoint = useCallback(async (lat: number, lng: number) => {
    const requestId = ++requestIdRef.current;
    const isStale = () => requestId !== requestIdRef.current;

    const labelName = findMapLabelName(mapRef.current, lat, lng);

    setPin((prev) => ({
      name: labelName ?? prev?.name ?? "",
      placeName: labelName ?? prev?.placeName ?? "Locating…",
      lat,
      lng,
    }));
    if (labelName) setSearchText(labelName);
    setResolving(true);
    setResolveError(null);

    try {
      let name = labelName ?? "";
      let placeName = "";

      // Area context (city, region, country) for building a full address line.
      const area = await reverseGeocode(lat, lng, "neighborhood,locality,place");
      if (isStale()) return;
      const areaText = area ? areaFrom(area.placeName) : "";

      if (labelName) {
        placeName = areaText ? `${labelName}, ${areaText}` : labelName;
      } else {
        const poi = await reverseGeocodeNearestPoi(lat, lng);
        if (isStale()) return;

        if (poi) {
          name = poi.name;
          placeName = poi.placeName;
        } else {
          const address = await reverseGeocode(lat, lng, "address");
          if (isStale()) return;

          if (address) {
            name = address.name;
            placeName = address.placeName;
          } else if (area) {
            name = area.name;
            placeName = area.placeName;
          }
        }
      }

      if (!name) {
        name = "";
        placeName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }

      setPin({ name, placeName, lat, lng });
      setSearchText(placeName);
    } catch {
      if (isStale()) return;
      setResolveError("Could not look up the address. You can still use the pin.");
    } finally {
      if (!isStale()) setResolving(false);
    }
  }, []);

  const handleSuggestion = useCallback((result: GeocodeResult) => {
    requestIdRef.current += 1; // a search pick overrides any pending lookup
    setResolving(false);

    if (!result.id) {
      // The clear (X) button sends an empty result.
      setPin(null);
      setSearchText("");
      return;
    }

    setPin({
      name: result.name,
      placeName: result.placeName,
      lat: result.lat,
      lng: result.lng,
    });
    setSearchText(result.placeName);
    mapRef.current?.flyTo({
      center: [result.lng, result.lat],
      zoom: Math.max(mapRef.current.getZoom(), 12),
      duration: 800,
    });
  }, []);

  const handleMapClick = useCallback(
    (event: { lngLat: { lat: number; lng: number } }) => {
      void resolvePoint(event.lngLat.lat, event.lngLat.lng);
    },
    [resolvePoint],
  );

  // While dragging: show the label under the pin live in the search box.
  const handleMarkerDrag = useCallback(
    (event: { lngLat: { lat: number; lng: number } }) => {
      const name = findMapLabelName(mapRef.current, event.lngLat.lat, event.lngLat.lng);
      if (name && name !== lastDragNameRef.current) {
        lastDragNameRef.current = name;
        setSearchText(name);
      }
    },
    [],
  );

  const handleMarkerDragEnd = useCallback(
    (event: { lngLat: { lat: number; lng: number } }) => {
      lastDragNameRef.current = "";
      void resolvePoint(event.lngLat.lat, event.lngLat.lng);
    },
    [resolvePoint],
  );

  const handleConfirm = useCallback(() => {
    if (!pin) return;
    onConfirm(pin);
    onOpenChange(false);
  }, [pin, onConfirm, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <div className="flex h-full w-full flex-col bg-background sm:h-auto sm:max-h-[95vh] sm:w-[720px] sm:max-w-[92vw] sm:overflow-y-auto sm:rounded-lg sm:border sm:border-border sm:shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <h2 className="text-base font-bold sm:text-lg">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border px-4 py-3 sm:px-5">
          <LocationSearchInput
            value={searchText}
            onChange={setSearchText}
            onSelect={handleSuggestion}
            placeholder="Search a community, port, street or town"
          />
        </div>

        {/* Map */}
        <div className="relative h-[420px] sm:h-[480px]">
          <BaseMap
            ref={mapRef}
            center={
              pin
                ? { lat: pin.lat, lng: pin.lng }
                : initial
                  ? { lat: initial.lat, lng: initial.lng }
                  : GHANA_CENTER
            }
            zoom={pin ? 13 : initial ? 13 : GHANA_ZOOM}
            height={420}
            className="!rounded-none !border-0 !h-full"
            mapProps={{
              onClick: handleMapClick,
              cursor: "crosshair",
            }}
          >
            {pin ? (
              <Marker
                longitude={pin.lng}
                latitude={pin.lat}
                draggable
                anchor="bottom"
                onDrag={handleMarkerDrag}
                onDragEnd={handleMarkerDragEnd}
              >
                <div className="flex flex-col items-center" aria-label="Selected location pin">
                  <MapPin
                    className="h-9 w-9 text-primary drop-shadow-md"
                    strokeWidth={2.5}
                    fill="white"
                  />
                </div>
              </Marker>
            ) : null}
          </BaseMap>

          {/* Instruction overlay */}
          <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-foreground/85 px-3 py-1.5 text-xs font-medium text-background shadow-md">
            Tap the map or drag the pin to place it exactly
          </div>
        </div>

        <div className="border-t border-border bg-muted/40 px-4 py-3 sm:px-5">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              {resolving ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Looking up the address…
                </div>
              ) : pin ? (
                <>
                  <p className="truncate text-sm font-medium text-foreground">
                    {pin.name || "Unnamed location"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{pin.placeName}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Search a place or tap the map to drop a pin.
                </p>
              )}
              {resolveError ? (
                <p className="mt-1 text-xs text-destructive">{resolveError}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:justify-end sm:px-5 sm:py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:order-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!pin || resolving} className="sm:order-2">
            Use this location
          </Button>
        </div>
      </div>
    </div>
  );
}