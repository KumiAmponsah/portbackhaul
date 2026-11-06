import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export interface Truck {
  id: string;
  registration_no: string;
  truck_type: string;
  capacity_tons: number;
  owner_id: string;
  verification_status: string;
  is_available: boolean;
}

export interface DriverDirectoryEntry {
  id: string;
  name: string;
  phone: string | null;
  profile_id: string;
  verification_status: string;
  is_available: boolean;
}

export interface MyDriverRecord {
  id: string;
  profile_id: string;
  assigned_truck_id: string | null;
  truck_owner_id: string | null;
  licence_no: string | null;
  licence_expiry: string | null;
  verification_status: string;
  is_available: boolean;
  completed_trips: number;
  rating: number | null;
}

/**
 * Every truck on the platform.
 *
 * Used by:
 *   - TripDetail, ShipmentDetail   (look up the assigned truck for a trip/shipment)
 *   - AgentTrips, AvailableTrucks  (map truck_id -> registration_no)
 *   - DriverHome, DriverTrip       (show the driver's assigned truck details)
 */
export function useTrucks() {
  return useQuery({
    queryKey: ["trucks"],
    staleTime: 30_000,
    queryFn: async (): Promise<Truck[]> => {
      const { data, error } = await supabase
        .from("trucks")
        .select(
          "id, registration_no, truck_type, capacity_tons, owner_id, verification_status, is_available",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Truck[];
    },
  });
}

/**
 * Driver directory keyed by drivers.id.
 *
 * Used by:
 *   - TripDetail, ShipmentDetail   (driver name + phone for an assignment)
 *   - AgentTrips, AvailableTrucks  (driver name shown next to a truck)
 *
 * Two round-trips (drivers, then profiles) rather than a join, because the
 * join syntax is sensitive to the generated types. Two queries is bulletproof.
 */
export function useDriverDirectory() {
  return useQuery({
    queryKey: ["driver-directory"],
    staleTime: 30_000,
    queryFn: async (): Promise<Record<string, DriverDirectoryEntry>> => {
      const { data: drivers, error: dErr } = await supabase
        .from("drivers")
        .select("id, profile_id, verification_status, is_available");

      if (dErr) throw dErr;
      if (!drivers || drivers.length === 0) return {};

      const profileIds = drivers.map((d) => d.profile_id);
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", profileIds);

      if (pErr) throw pErr;

      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      const result: Record<string, DriverDirectoryEntry> = {};
      for (const d of drivers) {
        const profile = byId.get(d.profile_id);
        result[d.id] = {
          id: d.id,
          profile_id: d.profile_id,
          name: profile?.full_name ?? "Unnamed driver",
          phone: profile?.phone ?? null,
          verification_status: d.verification_status,
          is_available: d.is_available,
        };
      }
      return result;
    },
  });
}

/**
 * The current authenticated user's drivers row.
 *
 * Returns `null` if the user has no drivers row yet. That's a valid state:
 * the profile can exist before an admin has provisioned the drivers record.
 */
export function useMyDriverRecord() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  return useQuery({
    queryKey: ["my-driver-record", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<MyDriverRecord | null> => {
      const { data, error } = await supabase
        .from("drivers")
        .select(
          "id, profile_id, assigned_truck_id, truck_owner_id, licence_no, licence_expiry, verification_status, is_available, completed_trips, rating",
        )
        .eq("profile_id", userId!)
        .maybeSingle();

      if (error) throw error;
      return (data as MyDriverRecord | null) ?? null;
    },
  });
}

/**
 * Toggle the current driver's `is_available` flag.
 *
 * Used by DriverHome's "Go online / Go offline" switch.
 *
 * Updates by `profile_id = auth.user.id` (matches `useMyDriverRecord`), so the
 * caller does not need to pass the drivers row id. The `profiles_guard_protected`
 * trigger only guards role/status columns on `profiles` — it does NOT block
 * updates to `drivers.is_available`, so this writes cleanly from the client.
 */
export function useSetDriverAvailability() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isAvailable: boolean): Promise<void> => {
      if (!userId) throw new Error("Not signed in.");

      const { error } = await supabase
        .from("drivers")
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq("profile_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-driver-record"] });
      void queryClient.invalidateQueries({ queryKey: ["driver-directory"] });
    },
  });
}