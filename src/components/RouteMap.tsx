import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import { Navigation, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface DriverInfo {
  name: string;
  phone?: string;
  truckReg?: string;
  truckType?: string;
}

interface RouteMapProps {
  pickup: MapPoint | null;
  destination: MapPoint | null;
  trail?: MapPoint[];
  current?: MapPoint | null;
  routeGeometry?: [number, number][] | null;
  lastUpdated?: string | null;
  driver?: DriverInfo | null; 
  className?: string;
  height?: number;
}

export function RouteMap({
  pickup,
  destination,
  trail = [],
  current,
  routeGeometry,
  lastUpdated,
  driver,
  className,
  height = 400,
}: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const truckMarker = useRef<mapboxgl.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    if (!mapContainer.current || map.current) return;

    const startPoint = current || pickup || destination || { lng: -0.1869, lat: 5.6037 };

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [startPoint.lng, startPoint.lat],
      zoom: 12,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-left");

    map.current.on("load", () => {
      // Add Route Line
      if (routeGeometry && map.current) {
        map.current.addSource("route", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeGeometry } },
        });

        map.current.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#1B263B", "line-width": 5, "line-opacity": 0.8 },
        });
      }

      // Add Markers
      if (pickup) new mapboxgl.Marker({ color: "#10b981" }).setLngLat([pickup.lng, pickup.lat]).addTo(map.current!);
      if (destination) new mapboxgl.Marker({ color: "#1B263B" }).setLngLat([destination.lng, destination.lat]).addTo(map.current!);

      // Add Truck Marker
      if (current) createTruckMarker(current);
    });

    return () => { map.current?.remove(); map.current = null; };
  }, [pickup, destination, routeGeometry]);

  // Smoothly move the truck when coordinates update
  useEffect(() => {
    if (!map.current || !current) return;

    if (truckMarker.current) {
      truckMarker.current.setLngLat([current.lng, current.lat]);
    } else if (map.current.loaded()) {
      createTruckMarker(current);
    }

    // Ease map to follow the truck
    map.current.easeTo({
      center: [current.lng, current.lat],
      duration: 2000, // 2 seconds for a smooth glide
      zoom: 14,       // Zoom in closely to the truck
    });
  }, [current]);

  function createTruckMarker(point: MapPoint) {
    const el = document.createElement("div");
    el.className = "truck-marker";
    el.innerHTML = `
      <div class="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-4 border-white animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      </div>
    `;
    truckMarker.current = new mapboxgl.Marker(el).setLngLat([point.lng, point.lat]).addTo(map.current!);
  }

  if (!MAPBOX_TOKEN) return <div className="flex items-center justify-center rounded-lg bg-muted" style={{ height }}><p>Mapbox token missing</p></div>;

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border shadow-sm", className)} style={{ height }}>
      <div ref={mapContainer} className="h-full w-full" />

      {/* UBER/BOLT STYLE TRACKING CARD */}
      {current && driver ? (
        <div className="absolute bottom-6 left-6 right-6 z-10 mx-auto max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl backdrop-blur bg-card/95 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">Arriving shortly</p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {driver.truckReg || "Truck"} · {driver.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-primary">
                ~5 min
              </p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">ETA</p>
            </div>
          </div>
        </div>
      ) : null}

      {lastUpdated ? (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-border bg-card/90 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
          <Navigation className="h-3.5 w-3.5 text-primary animate-pulse" />
          Live tracking
        </div>
      ) : null}
    </div>
  );
}