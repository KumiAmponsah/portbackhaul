import { AlertTriangle, ArrowRight, Ban, Clock, PauseCircle, ShieldX, type LucideIcon } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ACCOUNT_STATUS_MESSAGE, ROLE_HOME, ROLE_LABEL, type AccountStatus as Status } from "@/lib/roles";

const ICONS: Record<Exclude<Status, "APPROVED">, LucideIcon> = {
  PENDING: Clock,
  REJECTED: ShieldX,
  SUSPENDED: PauseCircle,
  BLOCKED: Ban,
};

const HEADINGS: Record<Exclude<Status, "APPROVED">, string> = {
  PENDING: "Account under verification",
  REJECTED: "Verification not approved",
  SUSPENDED: "Account suspended",
  BLOCKED: "Account blocked",
};

export default function AccountStatusPage() {
  const { profile, signOut } = useAuth();

  if (!profile) return null;
  if (profile.account_status === "APPROVED") return <Navigate to={ROLE_HOME[profile.role]} replace />;

  const status = profile.account_status as Exclude<Status, "APPROVED">;
  const Icon = ICONS[status];

  const reason =
    status === "REJECTED"
      ? profile.rejection_reason
      : status === "SUSPENDED"
        ? profile.suspension_reason
        : status === "BLOCKED"
          ? profile.block_reason
          : null;

  const canResubmit = status === "PENDING" || status === "REJECTED";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Seo title="Account status · PortBackhaul" description="Your PortBackhaul account status." path="/app/account-status" noIndex />

      <header className="border-b border-border px-6 py-5">
        <Link to="/" aria-label="PortBackhaul home">
          <Logo />
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="panel w-full max-w-xl animate-rise p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-status-pending-bg text-status-pending">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">{HEADINGS[status]}</h1>
                <StatusBadge status={profile.account_status} raw />
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {ACCOUNT_STATUS_MESSAGE[status]}
              </p>
            </div>
          </div>

          {reason ? (
            <div className="mt-6 rounded-lg border border-border bg-muted/60 p-4">
              <p className="eyebrow mb-1.5">Reason given</p>
              <p className="text-sm text-foreground">{reason}</p>
            </div>
          ) : null}

          <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <dt className="eyebrow mb-1">Registered as</dt>
              <dd className="text-sm font-semibold">{ROLE_LABEL[profile.role]}</dd>
            </div>
            <div>
              <dt className="eyebrow mb-1">Verification</dt>
              <dd>
                <StatusBadge status={profile.verification_status} raw />
              </dd>
            </div>
          </dl>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            {canResubmit ? (
              <Button asChild className="flex-1">
                <Link to="/app/profile">
                  {profile.verification_status === "NOT_SUBMITTED" ? "Submit verification" : "Review my documents"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="flex-1">
              <Link to="/contact">Contact support</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 text-sm text-muted-foreground underline hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      <footer className="border-t border-border px-6 py-5">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Verification reviews are performed by PortBackhaul administrators. We never request payment to approve an
          account.
        </p>
      </footer>
    </div>
  );
}
