import type { PostgrestError } from "@supabase/supabase-js";

/** Structured authorization / workflow error codes raised by backend functions. */
export const ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_PENDING: "Your account is still under verification, so this action is not available yet.",
  ACCOUNT_REJECTED: "Your verification was not approved, so this action is not available.",
  ACCOUNT_SUSPENDED: "Your account is temporarily suspended. Contact platform support for assistance.",
  ACCOUNT_BLOCKED: "Your account has been blocked from using this platform.",
  VERIFICATION_REQUIRED: "Complete your verification before performing this action.",
  ROLE_NOT_AUTHORIZED: "Your role does not permit this action.",
  RESOURCE_NOT_AUTHORIZED: "You do not have access to this record.",
  ADMIN_PERMISSION_REQUIRED: "You do not have the administrative permission required for this action.",
  REASON_REQUIRED: "A reason is required for this action.",
  INVALID_STATUS_TRANSITION: "That status change is not allowed from the current state.",
  INVALID_ACTION: "That action is not recognised.",
  DUPLICATE_ASSIGNMENT: "This job has already been responded to.",
  DOCUMENTS_REQUIRED: "Upload at least one document before submitting for verification.",
  QR_INVALID: "This QR code is not valid.",
  QR_EXPIRED: "This QR code has expired. Ask the driver to refresh it.",
  QR_REVOKED: "This QR code has been revoked.",
  TRIP_NOT_ACTIVE: "This trip is no longer active and cannot be verified.",
  OTP_INVALID: "The delivery code is incorrect.",
  OTP_NOT_ISSUED: "No delivery code has been issued for this trip yet.",
  RECEIVER_NAME_REQUIRED: "Enter the name of the person receiving the cargo.",
  TRUCK_UNAVAILABLE: "That truck is no longer available.",
  GPS_UNAVAILABLE: "Location is unavailable. Enable location access and try again.",
  EMAIL_PROVIDER_NOT_CONFIGURED: "Email delivery is not configured yet. Please contact platform support.",
  EMAIL_SEND_FAILED: "We couldn't send the verification email. Please try again in a few minutes.",
  EMAIL_RATE_LIMITED: "Too many emails requested. Please wait a few minutes and try again.",
  EMAIL_ALREADY_REGISTERED: "An account with this email already exists. Try signing in instead.",
  EMAIL_INVALID: "Enter a valid email address.",
  WEAK_PASSWORD: "Use a password of at least 8 characters.",
  INVALID_REDIRECT: "Could not start the verification flow. Please try again.",
  SIGNUP_FAILED: "Could not create your account. Please try again.",
  PAYMENT_PROVIDER_ERROR: "The payment provider could not complete this request. Please try again shortly.",
  RECIPIENT_REQUIRED: "The carrier has not set up their mobile money payout details yet, so this trip cannot be paid.",
  PAYOUT_DETAILS_LOCKED: "These payout details are locked because a settlement is already in progress.",
  INVALID_PHONE: "Enter a valid Ghana mobile money number (e.g. 024 123 4567).",
  INVALID_MOMO_NETWORK: "Choose a supported mobile money network (MTN, Telecel or AirtelTigo).",
  INVALID_AMOUNT: "Enter a valid payment amount.",
  EMAIL_REQUIRED: "An email address is required by the payment provider. Add one to your profile.",
};

/**
 * Converts any Supabase / network failure into a human-readable message,
 * preferring our structured backend error codes when present.
 */
export function describeError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) return fallback;

  const raw =
    typeof error === "string"
      ? error
      : ((error as PostgrestError)?.message ?? (error as Error)?.message ?? "");

  if (!raw) return fallback;

  if (import.meta.env.DEV) {
    const err = error as { code?: string; status?: number };
    console.error(
      `[auth-error] code=${err.code ?? "n/a"} status=${err.status ?? "n/a"} message=${raw.slice(0, 500)}`,
    );
  }

  for (const code of Object.keys(ERROR_MESSAGES)) {
    if (raw.includes(code)) return ERROR_MESSAGES[code];
  }

  if (/Failed to fetch|NetworkError|network request failed/i.test(raw)) {
    return "Network unavailable. Check your connection and try again.";
  }
  if (/row-level security|violates row-level/i.test(raw)) {
    return "You are not authorised to perform this action.";
  }
  if (/duplicate key/i.test(raw)) {
    return "That record already exists.";
  }
  if (/Invalid login credentials/i.test(raw)) {
    return "Incorrect email or password.";
  }
  if (/Email not confirmed/i.test(raw)) {
    return "Please verify your email address before signing in.";
  }
  if (/User already registered/i.test(raw)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (/error sending (confirmation|invite|magic link|recovery) email/i.test(raw)) {
    return "We couldn't send your verification email. Please try again in a few minutes.";
  }

  return raw;
}

/** Extracts the structured error code when the backend raised one. */
export function errorCode(error: unknown): string | null {
  const raw = typeof error === "string" ? error : ((error as Error)?.message ?? "");
  for (const code of Object.keys(ERROR_MESSAGES)) {
    if (raw.includes(code)) return code;
  }
  return null;
}