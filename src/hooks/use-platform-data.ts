import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export interface PlatformLocation {
  id: string;
  name: string;
  city: string | null;
  country: string;
  kind: string;
  latitude: number | null;
  longitude: number | null;
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<PlatformLocation[]> => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, city, country, kind, latitude, longitude")
        .eq("is_active", true)
        .order("country")
        .order("name");
      if (error) throw new Error(describeError(error));
      return (data ?? []) as PlatformLocation[];
    },
  });
}

export interface ClearingAgentSummary {
  profile_id: string;
  company_name: string;
  licence_no: string | null;
  office_location: string | null;
}

export function useClearingAgents() {
  return useQuery({
    queryKey: ["clearing-agents"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ClearingAgentSummary[]> => {
      const { data, error } = await supabase
        .from("clearing_agents")
        .select("profile_id, company_name, licence_no, office_location")
        .eq("is_accepting_work", true)
        .order("company_name");
      if (error) throw new Error(describeError(error));
      return (data ?? []) as ClearingAgentSummary[];
    },
  });
}

export function usePlatformSetting(key: string) {
  return useQuery({
    queryKey: ["platform-setting", key],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<unknown> => {
      const { data, error } = await supabase.from("platform_settings").select("value").eq("key", key).maybeSingle();
      if (error) throw new Error(describeError(error));
      return data?.value ?? null;
    },
  });
}

export interface VerificationRequirement {
  id: string;
  role: string;
  document_type: string;
  label: string;
  is_required: boolean;
  requires_number: boolean;
  requires_expiry: boolean;
  sort_order: number;
}

export function useVerificationRequirements(role: string | undefined) {
  return useQuery({
    queryKey: ["verification-requirements", role],
    enabled: Boolean(role),
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<VerificationRequirement[]> => {
      const { data, error } = await supabase
        .from("verification_requirements")
        .select("*")
        .eq("role", role!)
        .order("sort_order");
      if (error) throw new Error(describeError(error));
      return (data ?? []) as VerificationRequirement[];
    },
  });
}

export interface CustomsIntegration {
  id: string;
  provider_key: string;
  display_name: string;
  connection_status: string;
  authority: string | null;
  notes: string | null;
}

export function useCustomsIntegrations() {
  return useQuery({
    queryKey: ["customs-integrations"],
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<CustomsIntegration[]> => {
      const { data, error } = await supabase
        .from("customs_integrations")
        .select("id, provider_key, display_name, connection_status, authority, notes")
        .order("display_name");
      if (error) throw new Error(describeError(error));
      return (data ?? []) as CustomsIntegration[];
    },
  });
}
