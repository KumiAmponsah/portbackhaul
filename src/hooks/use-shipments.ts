import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export interface Shipment {
  id: string;
  cargo_ref: string;
  owner_id: string;
  clearing_agent_id: string | null;
  description: string;
  cargo_type: string;
  quantity: number | null;
  quantity_unit: string | null;
  weight_kg: number | null;
  container_number: string | null;
  consignee_name: string | null;
  consignee_contact: string | null;
  pickup_location_id: string | null;
  pickup_location_text: string | null;
  destination_location_id: string | null;
  destination_city: string | null;
  destination_country: string | null;
  expected_pickup_date: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  special_instructions: string | null;
  status: string;
  transport_fee_ghs: number | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

const SHIPMENT_COLUMNS =
  "id, cargo_ref, owner_id, clearing_agent_id, description, cargo_type, quantity, quantity_unit, weight_kg, container_number, consignee_name, consignee_contact, pickup_location_id, pickup_location_text, destination_location_id, destination_city, destination_country, expected_pickup_date, contact_person, contact_phone, special_instructions, status, transport_fee_ghs, is_demo, created_at, updated_at";

/** All shipments visible to the signed-in user (scoped by RLS). */
export function useShipments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["shipments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Shipment[]> => {
      const { data, error } = await supabase
        .from("cargo_shipments")
        .select(SHIPMENT_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load shipments", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as Shipment[];
    },
  });
}

export function useShipment(id: string | undefined) {
  return useQuery({
    queryKey: ["shipment", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<Shipment | null> => {
      const { data, error } = await supabase
        .from("cargo_shipments")
        .select(SHIPMENT_COLUMNS)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw new Error(describeError(error));
      return (data as Shipment | null) ?? null;
    },
  });
}

export interface ShipmentDraft {
  description: string;
  cargo_type: string;
  quantity: number | null;
  quantity_unit: string;
  weight_kg: number | null;
  container_number: string | null;
  consignee_name: string | null;
  consignee_contact: string | null;
  pickup_location_id: string | null;
  pickup_location_text: string | null;
  destination_location_id: string | null;
  destination_city: string | null;
  destination_country: string | null;
  expected_pickup_date: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  special_instructions: string | null;
  transport_fee_ghs: number | null;
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (draft: ShipmentDraft): Promise<Shipment> => {
      const { data, error } = await supabase
        .from("cargo_shipments")
        .insert({ ...draft, owner_id: user!.id, status: "DRAFT" })
        .select(SHIPMENT_COLUMNS)
        .single();
      if (error) throw new Error(describeError(error));
      return data as Shipment;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ShipmentDraft> }) => {
      const { error } = await supabase.from("cargo_shipments").update(patch).eq("id", id);
      if (error) throw new Error(describeError(error));
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      void queryClient.invalidateQueries({ queryKey: ["shipment", variables.id] });
    },
  });
}

/** Submits a draft shipment and optionally invites a clearing agent (server-side). */
export function useSubmitShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, agentId }: { shipmentId: string; agentId?: string | null }) => {
      const { error } = await supabase.rpc("submit_shipment", {
        p_shipment_id: shipmentId,
        p_agent_id: agentId ?? undefined,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      void queryClient.invalidateQueries({ queryKey: ["shipment"] });
    },
  });
}

export function useAcceptCargoAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipmentId: string) => {
      const { error } = await supabase.rpc("accept_cargo_assignment", { p_shipment_id: shipmentId });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      void queryClient.invalidateQueries({ queryKey: ["shipment"] });
    },
  });
}

export function useUpdateOperationalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, status }: { shipmentId: string; status: string }) => {
      const { error } = await supabase.rpc("update_shipment_operational_status", {
        p_shipment_id: shipmentId,
        p_status: status,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      void queryClient.invalidateQueries({ queryKey: ["shipment"] });
    },
  });
}
