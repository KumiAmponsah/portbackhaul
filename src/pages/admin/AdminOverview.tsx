import {
  AlertTriangle,
  CreditCard,
  FileText,
  MapPin,
  ShieldAlert,
  Truck,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { useAdminOverview } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { CUSTOMS_DISCLAIMER } from "@/lib/customsIntegration";
import { formatGhs } from "@/lib/format";

export default function AdminOverview() {
  const { profile } = useAuth();
  const { data, isLoading, isError, error, refetch } = useAdminOverview();

  return (
    <div className="mx-auto w-full max-w-[1400px] animate-fade space-y-7">
      <Seo title="Admin overview · PortBackhaul" description="Platform overview." path="/admin" noIndex />

      <PageHeader
        eyebrow="Admin Dashboard"
        title="Platform overview"
        subtitle={`Signed in as ${profile?.full_name ?? "administrator"}`}
        actions={
          <Button asChild>
            <Link to="/admin/users">Review approvals</Link>
          </Button>
        }
      />

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="platform metrics" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading platform metrics…</div>
      ) : (
        <>
          <section>
            <h2 className="eyebrow mb-3">Accounts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={UserCheck} label="Pending approval" value={data?.pending_users ?? 0} to="/admin/users?status=PENDING" tone="pending" />
              <Metric icon={Users} label="Approved users" value={data?.approved_users ?? 0} to="/admin/users?status=APPROVED" tone="verified" />
              <Metric icon={ShieldAlert} label="Blocked" value={data?.blocked_users ?? 0} to="/admin/users?status=BLOCKED" tone="danger" />
              <Metric icon={Users} label="Total users" value={data?.total_users ?? 0} to="/admin/users" />
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-3">Operations</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={FileText} label="Shipments" value={data?.shipments ?? 0} to="/admin/cargo" />
              <Metric icon={MapPin} label="Active trips" value={data?.active_trips ?? 0} to="/admin/trips" tone="progress" />
              <Metric icon={MapPin} label="Completed trips" value={data?.completed_trips ?? 0} to="/admin/trips" tone="verified" />
              <Metric icon={Truck} label="Registered trucks" value={data?.trucks ?? 0} to="/admin/trucks" />
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-3">Finance & risk</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="panel p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Held in escrow
                </p>
                <p className="mt-1 font-mono text-2xl font-extrabold tabular text-status-pending">
                  {formatGhs(Number(data?.payments_held ?? 0))}
                </p>
              </div>
              <div className="panel p-5">
                <p className="text-sm font-medium text-muted-foreground">Released to carriers</p>
                <p className="mt-1 font-mono text-2xl font-extrabold tabular text-status-verified">
                  {formatGhs(Number(data?.payments_released ?? 0))}
                </p>
              </div>
              <Metric icon={AlertTriangle} label="Open disputes" value={data?.open_disputes ?? 0} to="/admin/disputes" tone="danger" />
            </div>
          </section>
        </>
      )}

      <div className="panel flex items-start gap-3 p-5">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Compliance note.</span> {CUSTOMS_DISCLAIMER} Administrators
          cannot create, edit or approve any Customs, ICUMS, GPHA or other government status inside this platform.
        </p>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  to,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  to: string;
  tone?: "pending" | "verified" | "progress" | "danger";
}) {
  const toneClass =
    tone === "pending"
      ? "bg-status-pending-bg text-status-pending"
      : tone === "verified"
        ? "bg-status-verified-bg text-status-verified"
        : tone === "progress"
          ? "bg-status-progress-bg text-status-progress"
          : tone === "danger"
            ? "bg-status-danger-bg text-status-danger"
            : "bg-muted text-muted-foreground";

  return (
    <Link to={to} className="panel flex items-center gap-4 p-5 transition-all hover:border-primary/40">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <span className="block text-sm font-medium text-muted-foreground">{label}</span>
        <span className="mt-0.5 block text-2xl font-extrabold tabular">{value}</span>
      </span>
    </Link>
  );
}
