// src/hooks/use-assignments.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ShipmentAssignment {
  id: string;
  shipment_id: string;
  requested_by: string;
  truck_type: string;
  required_capacity_tons: number;
  pickup_at: string | null;
  route_origin: string | null;
  route_destination: string | null;
  requirements_notes: string | null;
  offered_fee_ghs: number | null;
  truck_id: string | null;
  driver_id: string | null;
  status: string;
  decline_reason: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface AssignmentWithDetails extends ShipmentAssignment {
  shipment?: {
    id: string;
    cargo_ref: string | null;
    description: string | null;
    destination_city: string | null;
    pickup_location_text: string | null;
    weight_kg: number | null;
  } | null;
  truck?: {
    id: string;
    registration_no: string | null;
    truck_type: string | null;
    capacity_tons: number | null;
    verification_status: string | null;
  } | null;
  driver?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    verification_status: string | null;
  } | null;
}

const ASSIGNMENT_COLUMNS =
  "id, shipment_id, requested_by, truck_type, required_capacity_tons, pickup_at, route_origin, route_destination, requirements_notes, offered_fee_ghs, truck_id, driver_id, status, decline_reason, responded_at, created_at";

type DriverDetails = NonNullable<AssignmentWithDetails["driver"]>;

async function fetchDriverDetails(driverIds: string[]): Promise<Map<string, DriverDetails>> {
  const result = new Map<string, DriverDetails>();
  if (driverIds.length === 0) return result;

  const { data: driverRows, error } = await supabase
    .from("drivers")
    .select("id, profile_id, verification_status")
    .in("id", driverIds);

  if (error) {
    console.warn("drivers enrich failed", error.message);
    return result;
  }

  const profileIds = Array.from(
    new Set((driverRows ?? []).map((d) => d.profile_id).filter(Boolean) as string[]),
  );

  const { data: profileRows, error: profileError } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name, phone").in("id", profileIds)
    : { data: [], error: null };

  if (profileError) console.warn("driver profiles enrich failed", profileError.message);

  const profileMap = new Map((profileRows ?? []).map((p) => [p.id, p]));

  for (const d of driverRows ?? []) {
    const profile = profileMap.get(d.profile_id);
    result.set(d.id, {
      id: d.id,
      full_name: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      verification_status: d.verification_status ?? null,
    });
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

export function useAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["assignments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ShipmentAssignment[]> => {
      const { data, error } = await supabase
        .from("shipment_assignments")
        .select(ASSIGNMENT_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load assignments", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as ShipmentAssignment[];
    },
  });
}

export function useMyAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-assignments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<AssignmentWithDetails[]> => {
      const { data: rows, error } = await supabase
        .from("shipment_assignments")
        .select(ASSIGNMENT_COLUMNS)
        .eq("requested_by", user!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load my assignments", error.message);
        throw new Error(describeError(error));
      }

      const assignments = (rows ?? []) as ShipmentAssignment[];
      if (assignments.length === 0) return [];

      const shipmentIds = Array.from(
        new Set(assignments.map((a) => a.shipment_id).filter(Boolean)),
      );
      const truckIds = Array.from(
        new Set(assignments.map((a) => a.truck_id).filter(Boolean) as string[]),
      );
      const driverIds = Array.from(
        new Set(assignments.map((a) => a.driver_id).filter(Boolean) as string[]),
      );

      const [shipmentsRes, trucksRes, driverMap] = await Promise.all([
        shipmentIds.length
          ? supabase
              .from("cargo_shipments")   // ← FIXED (was "shipments")
              .select(
                "id, cargo_ref, description, destination_city, pickup_location_text, weight_kg",
              )
              .in("id", shipmentIds)
          : Promise.resolve({ data: [], error: null }),
        truckIds.length
          ? supabase
              .from("trucks")
              .select("id, registration_no, truck_type, capacity_tons, verification_status")
              .in("id", truckIds)
          : Promise.resolve({ data: [], error: null }),
        fetchDriverDetails(driverIds),
      ]);

      if (shipmentsRes.error)
        console.warn("shipments enrich failed", shipmentsRes.error.message);
      if (trucksRes.error) console.warn("trucks enrich failed", trucksRes.error.message);

      const shipmentMap = new Map((shipmentsRes.data ?? []).map((s: any) => [s.id, s]));
      const truckMap = new Map((trucksRes.data ?? []).map((t: any) => [t.id, t]));

      return assignments.map<AssignmentWithDetails>((a) => ({
        ...a,
        shipment: shipmentMap.get(a.shipment_id) ?? null,
        truck: a.truck_id ? truckMap.get(a.truck_id) ?? null : null,
        driver: a.driver_id ? driverMap.get(a.driver_id) ?? null : null,
      }));
    },
  });
}

export function useAssignment(id: string | null | undefined) {
  return useQuery({
    queryKey: ["assignment", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<AssignmentWithDetails | null> => {
      const { data: row, error } = await supabase
        .from("shipment_assignments")
        .select(ASSIGNMENT_COLUMNS)
        .eq("id", id!)
        .maybeSingle();

      if (error) {
        console.error("Failed to load assignment", error.message);
        throw new Error(describeError(error));
      }
      if (!row) return null;

      const a = row as ShipmentAssignment;

      const [shipmentRes, truckRes, driverMap] = await Promise.all([
        a.shipment_id
          ? supabase
              .from("cargo_shipments")   // ← FIXED (was "shipments")
              .select(
                "id, cargo_ref, description, destination_city, pickup_location_text, weight_kg",
              )
              .eq("id", a.shipment_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        a.truck_id
          ? supabase
              .from("trucks")
              .select("id, registration_no, truck_type, capacity_tons, verification_status")
              .eq("id", a.truck_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        fetchDriverDetails(a.driver_id ? [a.driver_id] : []),
      ]);

      return {
        ...a,
        shipment: (shipmentRes.data as any) ?? null,
        truck: (truckRes.data as any) ?? null,
        driver: a.driver_id ? driverMap.get(a.driver_id) ?? null : null,
      } as AssignmentWithDetails;
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Open requests for drivers                                          */
/* ------------------------------------------------------------------ */

export interface OpenRequest {
  id: string;
  shipment_id: string;
  truck_type: string;
  required_capacity_tons: number;
  pickup_at: string | null;
  route_origin: string | null;
  route_destination: string | null;
  requirements_notes: string | null;
  offered_fee_ghs: number | null;
  created_at: string;
  cargo_ref: string | null;
  cargo_description: string | null;
  weight_kg: number | null;
}

type LooseRpc = (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: any; error: { message: string } | null }>;
const rpc = supabase.rpc.bind(supabase) as unknown as LooseRpc;

export function useOpenRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["open-requests", user?.id],
    enabled: Boolean(user?.id),
    refetchInterval: 15_000,
    queryFn: async (): Promise<OpenRequest[]> => {
      const { data, error } = await rpc("open_requests_for_driver");
      if (error) {
        console.error("Failed to load open requests", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as OpenRequest[];
    },
  });
}

export function useAcceptOpenRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await rpc("accept_open_request", { p_assignment_id: assignmentId });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["open-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["open-requests"] });
    },
  });
}

export function useDeclineOpenRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, reason }: { assignmentId: string; reason?: string }) => {
      const { error } = await rpc("decline_open_request", {
        p_assignment_id: assignmentId,
        p_reason: reason ?? null,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["open-requests"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Matched trucks                                                     */
/* ------------------------------------------------------------------ */

export interface MatchedTruck {
  truck_id: string;
  registration_no: string;
  truck_type: string;
  capacity_tons: number;
  verification_status: string;
  is_available: boolean;
  distance_km: number | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_verification: string | null;
  driver_available: boolean | null;
}

export function useMatchedTrucks(params: {
  truckType: string | null;
  capacity: number;
  lat?: number | null;
  lng?: number | null;
  enabled?: boolean;
}) {
  const { truckType, capacity, lat, lng, enabled = true } = params;

  return useQuery({
    queryKey: ["matched-trucks", truckType, capacity, lat, lng],
    enabled: enabled && capacity > 0,
    queryFn: async (): Promise<MatchedTruck[]> => {
      const { data, error } = await supabase.rpc("match_trucks", {
        p_truck_type: truckType ?? undefined,
        p_capacity: capacity,
        p_lat: lat ?? undefined,
        p_lng: lng ?? undefined,
        p_limit: 10,
      });
      if (error) {
        console.error("Truck matching failed", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as MatchedTruck[];
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                          */
/* ------------------------------------------------------------------ */

export interface RequestTruckInput {
  shipmentId: string;
  truckType: string;
  capacity: number;
  pickupAt: string | null;
  origin: string;
  destination: string;
  notes?: string | null;
  fee?: number | null;
  truckId?: string | null;
}

export function useRequestTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RequestTruckInput) => {
      const { data, error } = await supabase.rpc("request_truck", {
        p_shipment_id: input.shipmentId,
        p_truck_type: input.truckType,
        p_capacity: input.capacity,
        p_pickup_at: input.pickupAt ?? undefined,
        p_origin: input.origin,
        p_destination: input.destination,
        p_notes: input.notes ?? undefined,
        p_fee: input.fee ?? undefined,
        p_truck_id: input.truckId ?? undefined,
      });
      if (error) throw new Error(describeError(error));
      const row = data as { id?: string } | string | null;
      if (typeof row === "string") return row;
      return row?.id ?? null;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["open-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

export function useCancelAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("shipment_assignments")
        .update({ status: "CANCELLED" })
        .eq("id", assignmentId);
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["open-requests"] });
    },
  });
}

export function useRespondToAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assignmentId,
      accept,
      reason,
    }: {
      assignmentId: string;
      accept: boolean;
      reason?: string;
    }) => {
      const { error } = await supabase.rpc("respond_to_assignment", {
        p_assignment_id: assignmentId,
        p_accept: accept,
        p_reason: reason ?? undefined,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["my-assignments"] });
      void queryClient.invalidateQueries({ queryKey: ["trips"] });
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}