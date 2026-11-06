export const ROLES = ["CLEARING_AGENT", "DRIVER", "ADMIN"] as const;

export type Role = (typeof ROLES)[number];

/** Roles a person may select at registration. ADMIN is never self-assignable. */
export const SIGNUP_ROLES: readonly Role[] = ["CLEARING_AGENT", "DRIVER"];

export const ROLE_LABEL: Record<Role, string> = {
  CLEARING_AGENT: "Clearing Agent",
  DRIVER: "Driver",
  ADMIN: "Administrator",
};

export const ROLE_BLURB: Record<Role, string> = {
  CLEARING_AGENT: "Handle clearance, request verified trucks and monitor trips.",
  DRIVER: "Accept jobs, run trips and confirm delivery.",
  ADMIN: "Platform operator.",
};

export type AccountStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "BLOCKED";

export type VerificationStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFO_REQUESTED"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export type AdminPermission =
  | "USER_APPROVE"
  | "USER_REJECT"
  | "USER_SUSPEND"
  | "USER_BLOCK"
  | "USER_UNBLOCK"
  | "DOCUMENT_REVIEW"
  | "USER_VIEW"
  | "ADMIN_VIEW"
  | "SETTINGS_MANAGE"
  | "PAYMENT_MANAGE"
  | "DISPUTE_MANAGE";

/** The dashboard home route for each role. */
export const ROLE_HOME: Record<Role, string> = {
  CLEARING_AGENT: "/app/agent/trips",
  DRIVER: "/app/driver",
  ADMIN: "/admin",
};

export const ACCOUNT_STATUS_MESSAGE: Record<Exclude<AccountStatus, "APPROVED">, string> = {
  PENDING:
    "Your account is under verification. You will receive a notification once your account has been reviewed.",
  REJECTED:
    "Your verification was not approved. Please review the reason and resubmit the required information if permitted.",
  SUSPENDED: "Your account is temporarily suspended. Please contact platform support for assistance.",
  BLOCKED:
    "Your account has been blocked from using this platform. Please contact platform support if you believe this was an error.",
};