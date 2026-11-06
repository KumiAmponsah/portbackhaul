import { supabase } from "@/integrations/supabase/client";

/**
 * customsIntegration — integration-ready service layer for authorised
 * government / port systems (ICUMS, GPHA, GRA).
 *
 * NOTHING here fabricates an official status. Until a formally authorised
 * integration is configured and verified, every call returns
 * INTEGRATION_NOT_CONNECTED and the UI must say so plainly. The app must never
 * display "Customs Released", "ICUMS Verified" or similar wording derived from
 * anything other than a verified authorised source.
 */

export type IntegrationStatus = "INTEGRATION_NOT_CONNECTED" | "PENDING_AUTHORISATION" | "CONNECTED" | "ERROR";

export interface IntegrationResult {
  status: IntegrationStatus;
  operation: string;
  provider: string | null;
  authority: string | null;
  message: string;
  /** Populated only when an authorised integration returns real data. */
  data?: Record<string, unknown>;
}

async function call(operation: string, shipmentId?: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc("customs_integration_call", {
    p_operation: operation,
    p_shipment_id: shipmentId ?? undefined,
    p_payload: payload as never,
  });

  if (error) {
    console.error(`customsIntegration.${operation} failed`, error.message);
    return {
      status: "ERROR" as const,
      operation,
      provider: null,
      authority: null,
      message: "The integration layer could not be reached.",
    };
  }

  return data as unknown as IntegrationResult;
}

export const customsIntegration = {
  /** Verify a consignment against an authorised customs system. */
  verifyConsignment: (shipmentId: string, reference: string) =>
    call("verifyConsignment", shipmentId, { reference }),

  /** Retrieve the consignment's status from an authorised customs system. */
  getConsignmentStatus: (shipmentId: string, reference: string) =>
    call("getConsignmentStatus", shipmentId, { reference }),

  /** Check a formal release status. Never inferred or entered manually. */
  verifyReleaseStatus: (shipmentId: string, reference: string) =>
    call("verifyReleaseStatus", shipmentId, { reference }),

  /** Check a transit declaration status for cross-border movements. */
  verifyTransitStatus: (shipmentId: string, reference: string) =>
    call("verifyTransitStatus", shipmentId, { reference }),
};

export const CUSTOMS_DISCLAIMER =
  "PortBackhaul is not connected to Ghana Customs, GRA/ICUMS, GPHA or any port authority system. Statuses shown here are the platform's own operational logistics records only.";
