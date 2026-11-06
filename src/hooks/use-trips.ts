import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export interface Trip {
  id: string;
  trip_ref: string;
  shipment_id: string;
  driver_id: string;
  truck_id: string;
  clearing_agent_id: string | null;
  cargo_owner_id: string;
  pickup_location_text: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  destination_text: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  status: string;
  transport_fee_ghs: number | null;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  is_demo: boolean;
  created_at: string;
}

const TRIP_COLUMNS =
  "id, trip_ref, shipment_id, driver_id, truck_id, clearing_agent_id, cargo_owner_id, pickup_location_text, pickup_lat, pickup_lng, destination_text, destination_lat, destination_lng, status, transport_fee_ghs, assigned_at, started_at, completed_at, is_demo, created_at";

export function useTrips() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["trips", user?.id],
    enabled: Boolean(user?.id),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<Trip[]> => {
      const { data, error } = await supabase
        .from("trip_assignments")
        .select(TRIP_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load trips", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as Trip[];
    },
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ["trip", id],
    enabled: Boolean(id),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<Trip | null> => {
      const { data, error } = await supabase.from("trip_assignments").select(TRIP_COLUMNS).eq("id", id!).maybeSingle();
      if (error) throw new Error(describeError(error));
      return (data as Trip | null) ?? null;
    },
  });
}

export interface TripStatusEvent {
  id: string;
  previous_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

export function useTripHistory(tripId: string | undefined) {
  return useQuery({
    queryKey: ["trip-history", tripId],
    enabled: Boolean(tripId),
    queryFn: async (): Promise<TripStatusEvent[]> => {
      const { data, error } = await supabase
        .from("trip_status_history")
        .select("id, previous_status, new_status, note, created_at")
        .eq("trip_id", tripId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as TripStatusEvent[];
    },
  });
}

export interface TripLocation {
  id: string;
  latitude: number;
  longitude: number;
  speed_kph: number | null;
  recorded_at: string;
}

export function useTripLocations(tripId: string | undefined) {
  const queryClient = useQueryClient();

  // 1. Fetch initial trail
  const query = useQuery({
    queryKey: ["trip-locations", tripId],
    enabled: Boolean(tripId),
    queryFn: async (): Promise<TripLocation[]> => {
      const { data, error } = await supabase
        .from("trip_locations")
        .select("id, latitude, longitude, speed_kph, recorded_at")
        .eq("trip_id", tripId!)
        .order("recorded_at", { ascending: true })
        .limit(200);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as TripLocation[];
    },
  });

  // 2. Subscribe to Realtime updates
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_locations",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          // Append the new coordinate to the cached trail instantly
          queryClient.setQueryData<TripLocation[]>(["trip-locations", tripId], (old) => {
            const newLoc = payload.new as TripLocation;
            return old ? [...old, newLoc] : [newLoc];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, queryClient]);

  return query;
}

export function useDriverAdvanceTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, action, note }: { tripId: string; action: string; note?: string }) => {
      const { error } = await supabase.rpc("driver_advance_trip", {
        p_trip_id: tripId,
        p_action: action,
        p_note: note ?? undefined,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      void queryClient.invalidateQueries({ queryKey: ["trip"] });
      void queryClient.invalidateQueries({ queryKey: ["trip-history"] });
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

export function useRecordTripLocation() {
  return useMutation({
    mutationFn: async ({
      tripId,
      lat,
      lng,
      speed,
      heading,
      accuracy,
    }: {
      tripId: string;
      lat: number;
      lng: number;
      speed?: number | null;
      heading?: number | null;
      accuracy?: number | null;
    }): Promise<boolean> => {
      const { data, error } = await supabase.rpc("record_trip_location", {
        p_trip_id: tripId,
        p_lat: lat,
        p_lng: lng,
        p_speed: speed ?? undefined,
        p_heading: heading ?? undefined,
        p_accuracy: accuracy ?? undefined,
      });
      if (error) throw new Error(describeError(error));
      return Boolean(data);
    },
  });
}

export function useIssueDeliveryOtp() {
  return useMutation({
    mutationFn: async (tripId: string): Promise<string> => {
      const { data, error } = await supabase.rpc("issue_delivery_otp", { p_trip_id: tripId });
      if (error) throw new Error(describeError(error));
      return data as unknown as string;
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tripId,
      otp,
      receiverName,
      signature,
      evidence,
      notes,
    }: {
      tripId: string;
      otp: string;
      receiverName: string;
      signature?: string | null;
      evidence?: string[];
      notes?: string;
    }) => {
      const { error } = await supabase.rpc("confirm_delivery", {
        p_trip_id: tripId,
        p_otp: otp,
        p_receiver_name: receiverName,
        p_signature: signature ?? undefined,
        p_evidence: evidence ?? [],
        p_notes: notes ?? undefined,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      void queryClient.invalidateQueries({ queryKey: ["trip"] });
      void queryClient.invalidateQueries({ queryKey: ["trip-history"] });
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}