import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export interface Payment {
  id: string;
  trip_id: string | null;
  shipment_id: string | null;
  payer_id: string | null;
  amount_ghs: number;
  currency: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  paid_at: string | null;
  released_at: string | null;
  failure_reason: string | null;
  is_demo: boolean;
  created_at: string;
}

const PAYMENT_COLUMNS =
  "id, trip_id, shipment_id, payer_id, amount_ghs, currency, provider, provider_reference, status, paid_at, released_at, failure_reason, is_demo, created_at";

export function usePayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Payment[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select(PAYMENT_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load payments", error.message);
        throw new Error(describeError(error));
      }
      return (data ?? []) as Payment[];
    },
  });
}

export interface Payout {
  id: string;
  trip_id: string | null;
  recipient_id: string;
  amount_ghs: number;
  status: string;
  requested_at: string | null;
  processed_at: string | null;
  created_at: string;
}

export function usePayouts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payouts", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Payout[]> => {
      const { data, error } = await supabase
        .from("payouts")
        .select("id, trip_id, recipient_id, amount_ghs, status, requested_at, processed_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as Payout[];
    },
  });
}

/**
 * All payment state changes run in the `payments-api` edge function with the
 * service-role key. The browser never writes payment rows directly.
 */
async function callPaymentsApi<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("payments-api", {
    body: { action, ...payload },
  });
  if (error) {
    const context = (error as { context?: { body?: string } }).context;
    throw new Error(describeError(context?.body ?? error.message, "Payment request failed."));
  }
  if ((data as { error?: string })?.error) {
    throw new Error(describeError((data as { error: string }).error));
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Mobile Money (Paystack) transactions — server-owned state. The browser can
// only read its own rows (RLS) and act through the payments-api function.
// ---------------------------------------------------------------------------

export interface MomoTransaction {
  reference: string;
  status: string;
  payout_status: string;
  amount_pesewas: number;
  momo_provider: string;
  gateway_response: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at?: string;
}

export interface MomoRecipient {
  full_name: string;
  phone: string;
  momo_provider: string;
  verification_status: string;
  is_active: boolean;
}

export function useMomoTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["momo-transactions", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<MomoTransaction[]> => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(
          "reference, status, payout_status, amount_pesewas, momo_provider, gateway_response, failure_reason, paid_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as MomoTransaction[];
    },
  });
}

export function usePaymentRecipient() {
  return useQuery({
    queryKey: ["payment-recipient"],
    queryFn: async (): Promise<MomoRecipient | null> => {
      const result = await callPaymentsApi<{ recipient: MomoRecipient | null }>("get_recipient", {});
      return result.recipient;
    },
  });
}

export function useSaveRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { fullName: string; phone: string; momoNetwork: string }) =>
      callPaymentsApi<{ ok: boolean; verification_status: string; provider_configured: boolean }>("save_recipient", {
        full_name: input.fullName,
        phone: input.phone,
        momo_network: input.momoNetwork,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payment-recipient"] }),
  });
}

export interface MomoInitiateResult extends MomoTransaction {
  display_text?: string | null;
  provider_configured: boolean;
}

export function useInitiateMomo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      paymentId: string;
      fullName: string;
      phone: string;
      momoNetwork: string;
      email?: string;
      requestKey: string;
    }) =>
      callPaymentsApi<MomoInitiateResult>("initiate_momo", {
        payment_id: input.paymentId,
        full_name: input.fullName,
        phone: input.phone,
        momo_network: input.momoNetwork,
        email: input.email ?? undefined,
        request_key: input.requestKey,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["momo-transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

/** Polls the authoritative server-side status while the charge is in flight. */
export function useMomoStatus(reference: string | null, active: boolean) {
  return useQuery({
    queryKey: ["momo-status", reference],
    enabled: Boolean(reference) && active,
    refetchInterval: 5_000,
    queryFn: async (): Promise<MomoTransaction> => callPaymentsApi<MomoTransaction>("momo_status", { reference }),
  });
}

export function useVerifyMomo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: string) => callPaymentsApi<MomoTransaction>("verify_momo", { reference }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["momo-transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export interface MomoStats {
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  refunded_payments: number;
  total_volume_pesewas: number;
  total_commission_pesewas: number;
  total_recipient_payouts_pesewas: number;
  pending_payouts: number;
  pending_payouts_pesewas: number;
  failed_payouts: number;
  paid_payouts: number;
}

/** Server-side aggregates for the admin dashboard — never computed client-side. */
export function useMomoStats() {
  return useQuery({
    queryKey: ["momo-stats"],
    queryFn: async (): Promise<MomoStats> => callPaymentsApi<MomoStats>("admin_momo_stats", {}),
  });
}

export function useProcessPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payoutId: string) =>
      callPaymentsApi<{ ok: boolean; status: string }>("process_payout", { payout_id: payoutId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["momo-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-table", "momo"] });
    },
  });
}

export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) =>
      callPaymentsApi<{ authorization_url: string | null; reference: string; simulated: boolean }>("initialize", {
        trip_id: tripId,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useRequestPaymentRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => callPaymentsApi<{ ok: true }>("request_release", { payment_id: paymentId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      void queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payoutId: string) => callPaymentsApi<{ ok: true }>("request_payout", { payout_id: payoutId }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payouts"] }),
  });
}

export interface Dispute {
  id: string;
  trip_id: string | null;
  shipment_id: string | null;
  raised_by: string;
  category: string;
  description: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

export function useDisputes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["disputes", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Dispute[]> => {
      const { data, error } = await supabase
        .from("disputes")
        .select("id, trip_id, shipment_id, raised_by, category, description, status, resolution_notes, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as Dispute[];
    },
  });
}

export function useRaiseDispute() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { tripId?: string | null; shipmentId?: string | null; category: string; description: string }) => {
      const { error } = await supabase.from("disputes").insert({
        trip_id: input.tripId ?? null,
        shipment_id: input.shipmentId ?? null,
        raised_by: user!.id,
        category: input.category,
        description: input.description,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["disputes"] }),
  });
}