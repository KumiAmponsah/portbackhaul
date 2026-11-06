export type StatusTone = "verified" | "pending" | "progress" | "danger" | "neutral";

const SHIPMENT_TONE: Record<string, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "pending",
  CLEARANCE_IN_PROGRESS: "progress",
  READY_FOR_TRANSPORT: "verified",
  TRUCK_REQUESTED: "pending",
  TRUCK_ASSIGNED: "verified",
  LOADING: "progress",
  IN_TRANSIT: "progress",
  DELIVERED: "verified",
  COMPLETED: "verified",
  CANCELLED: "neutral",
  DISPUTED: "danger",
};

const TRIP_TONE: Record<string, StatusTone> = {
  ASSIGNED: "pending",
  DRIVER_ACCEPTED: "verified",
  DRIVER_ARRIVED: "progress",
  LOADING: "progress",
  LOADED: "verified",
  IN_TRANSIT: "progress",
  ARRIVED_DESTINATION: "progress",
  DELIVERY_CONFIRMED: "verified",
  COMPLETED: "verified",
  CANCELLED: "neutral",
  DISPUTED: "danger",
};

const ACCOUNT_TONE: Record<string, StatusTone> = {
  PENDING: "pending",
  APPROVED: "verified",
  REJECTED: "danger",
  SUSPENDED: "pending",
  BLOCKED: "danger",
  NOT_SUBMITTED: "neutral",
  SUBMITTED: "pending",
  UNDER_REVIEW: "progress",
  MORE_INFO_REQUESTED: "pending",
  VERIFIED: "verified",
  EXPIRED: "danger",
};

const PAYMENT_TONE: Record<string, StatusTone> = {
  PENDING: "neutral",
  AUTHORIZED: "progress",
  PAID: "verified",
  HELD: "pending",
  RELEASE_REQUESTED: "pending",
  RELEASED: "verified",
  FAILED: "danger",
  REFUNDED: "neutral",
  DISPUTED: "danger",
  PROCESSING: "progress",
  SUCCESS: "verified",
  CANCELLED: "neutral",
  REVERSED: "danger",
  NONE: "neutral",
};

/** Maps any platform status string onto its visual tone. */
export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return (
    SHIPMENT_TONE[status] ?? TRIP_TONE[status] ?? ACCOUNT_TONE[status] ?? PAYMENT_TONE[status] ?? "neutral"
  );
}

/** Human label for a SCREAMING_SNAKE status. */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return status.replace(/_/g, " ");
}

export const SHIPMENT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "CLEARANCE_IN_PROGRESS",
  "READY_FOR_TRANSPORT",
  "TRUCK_REQUESTED",
  "TRUCK_ASSIGNED",
  "LOADING",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;

export const TRIP_STATUSES = [
  "ASSIGNED",
  "DRIVER_ACCEPTED",
  "DRIVER_ARRIVED",
  "LOADING",
  "LOADED",
  "IN_TRANSIT",
  "ARRIVED_DESTINATION",
  "DELIVERY_CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;

export const TRUCK_TYPES = [
  "FLATBED",
  "BOX",
  "TANKER",
  "TIPPER",
  "LOWBED",
  "REFRIGERATED",
  "CONTAINER_CHASSIS",
] as const;

export const CARGO_TYPES = [
  "GENERAL",
  "CONTAINERISED",
  "BULK",
  "REFRIGERATED",
  "HAZARDOUS",
  "LIQUID",
  "VEHICLE",
] as const;
