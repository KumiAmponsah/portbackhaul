// src/hooks/use-trip-payment.ts
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";

export interface TripPayment {
  id: string;
  trip_id: string | null;
  shipment_id: string | null;
  payer_id: string | null;
  amount_ghs: number;
  status: string;
  provider_reference: string | null;
}

const PAYMENT_COLUMNS =
  "id, trip_id, shipment_id, payer_id, amount_ghs, status, provider_reference";

export function useTripPayment(tripId: string | null | undefined) {
  return useQuery({
    queryKey: ["trip-payment", tripId],
    enabled: Boolean(tripId),
    queryFn: async (): Promise<TripPayment | null> => {
      const { data, error } = await supabase
        .from("payments")
        .select(PAYMENT_COLUMNS)
        .eq("trip_id", tripId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Failed to load trip payment", error.message);
        throw new Error(describeError(error));
      }
      return (data as TripPayment | null) ?? null;
    },
  });
}