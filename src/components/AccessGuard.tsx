import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { ROLE_HOME, type AdminPermission, type Role } from "@/lib/roles";

interface AccessGuardProps {
  children: ReactNode;
  /** Roles permitted to see this branch of the app. */
  roles?: readonly Role[];
  /** When true the account must be APPROVED (restricted marketplace function). */
  requireApproved?: boolean;
  /** Admin permission required in addition to the ADMIN role. */
  permission?: AdminPermission;
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
    </div>
  );
}

/**
 * Centralised frontend authorization gate. This is the UI layer only —
 * Supabase RLS and SECURITY DEFINER functions remain the real controls.
 */
export function AccessGuard({ children, roles, requireApproved = false, permission }: AccessGuardProps) {
  const { isLoading, session, profile, isEmailVerified, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!profile) return <FullPageSpinner />;

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to={ROLE_HOME[profile.role]} replace />;
  }

  if (profile.account_status !== "APPROVED") {
    // Non-approved users may still reach their account-status screen and profile.
    if (requireApproved || roles) {
      return <Navigate to="/app/account-status" replace />;
    }
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-bold">Permission required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have the administrative permission required to view this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
