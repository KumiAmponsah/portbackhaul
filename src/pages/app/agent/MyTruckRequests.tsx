import { ClipboardList, Loader2, Truck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import {
  useCancelAssignment,
  useMyAssignments,
  type AssignmentWithDetails,
} from "@/hooks/use-assignments";
import { describeError } from "@/lib/errors";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusTone(status: string) {
  switch (status) {
    case "ACCEPTED":
    case "TRUCK_ASSIGNED":
      return "bg-status-verified-bg text-status-verified";
    case "DECLINED":
    case "CANCELLED":
      return "bg-destructive/10 text-destructive";
    case "PENDING":
    case "TRUCK_REQUESTED":
      return "bg-status-pending-bg text-status-pending";
    default:
      return "bg-status-neutral-bg text-status-neutral";
  }
}

export default function MyTruckRequests() {
  const { data, isLoading } = useMyAssignments();
  const cancel = useCancelAssignment();

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-7">
      <Seo
        title="My truck requests · PortBackhaul"
        description="All truck requests you've made on PortBackhaul."
        path="/app/agent/my-truck-requests"
        noIndex
      />

      <PageHeader
        eyebrow="Truck Requests"
        title="My truck requests"
        subtitle="Every request you've made, with live status and full details."
      />

      <div className="flex justify-end">
        <Button asChild>
          <Link to="/app/agent/request-truck">
            <Truck className="mr-2 h-4 w-4" /> New request
          </Link>
        </Button>
      </div>

      <section className="panel p-6">
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (data ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                You haven't requested any trucks yet.
              </p>
              <Button asChild className="mt-4">
                <Link to="/app/agent/request-truck">Create your first request</Link>
              </Button>
            </div>
          ) : (
            (data ?? []).map((a) => (
              <Row
                key={a.id}
                assignment={a}
                onCancel={() => {
                  if (!confirm("Cancel this truck request?")) return;
                  cancel.mutate(a.id, {
                    onSuccess: () => toast.success("Request cancelled."),
                    onError: (err) =>
                      toast.error(describeError(err, "Could not cancel the request.")),
                  });
                }}
                cancelling={cancel.isPending}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  assignment,
  onCancel,
  cancelling,
}: {
  assignment: AssignmentWithDetails;
  onCancel: () => void;
  cancelling?: boolean;
}) {
  const canCancel =
    assignment.status === "PENDING" ||
    assignment.status === "TRUCK_REQUESTED" ||
    assignment.status === "OPEN";

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-mono text-base font-bold tabular">
              {assignment.shipment?.cargo_ref ?? assignment.shipment_id.slice(0, 8)}
            </h3>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                statusTone(assignment.status),
              )}
            >
              {assignment.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {assignment.shipment?.description ?? "Truck request"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDateTime(assignment.created_at)}
          </span>
          {canCancel ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={cancelling}
              onClick={onCancel}
            >
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Cell label="Truck type" value={assignment.truck_type.replace(/_/g, " ")} />
        <Cell label="Capacity" value={`${assignment.required_capacity_tons} tons`} />
        <Cell
          label="Offered fee"
          value={
            assignment.offered_fee_ghs === null
              ? "—"
              : `GHS ${Number(assignment.offered_fee_ghs).toLocaleString()}`
          }
        />
        <Cell
          label="Route"
          value={
            assignment.route_origin && assignment.route_destination
              ? `${assignment.route_origin} → ${assignment.route_destination}`
              : "—"
          }
        />
        <Cell label="Pickup" value={formatDateTime(assignment.pickup_at)} />
        <Cell
          label="Assigned truck"
          value={assignment.truck?.registration_no ?? "Awaiting driver"}
        />
      </dl>
    </article>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}