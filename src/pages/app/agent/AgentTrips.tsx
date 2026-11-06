import { ArrowRight, Clock, FileText, MoreVertical, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useAssignments } from "@/hooks/use-assignments";
import { useDriverDirectory, useTrucks } from "@/hooks/use-fleet";
import { useShipments } from "@/hooks/use-shipments";
import { useTrips } from "@/hooks/use-trips";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "CLEARANCE_IN_PROGRESS", label: "Clearance in Progress" },
  { key: "READY_FOR_TRANSPORT", label: "Ready for Transport" },
  { key: "TRUCK_REQUESTED", label: "Truck Requested" },
  { key: "TRUCK_ASSIGNED", label: "Truck Assigned" },
  { key: "IN_TRANSIT", label: "In Transit" },
] as const;

const ACTIVE_STATUSES = [
  "SUBMITTED",
  "CLEARANCE_IN_PROGRESS",
  "READY_FOR_TRANSPORT",
  "TRUCK_REQUESTED",
  "TRUCK_ASSIGNED",
  "LOADING",
  "IN_TRANSIT",
];

export default function AgentTrips() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<string>("ALL");

  const { data: shipments, isLoading, isError, error, refetch } = useShipments();
  const { data: trips } = useTrips();
  const { data: trucks } = useTrucks();
  const { data: assignments } = useAssignments();
  const { data: drivers } = useDriverDirectory();

  const active = useMemo(
    () => (shipments ?? []).filter((s) => ACTIVE_STATUSES.includes(s.status)),
    [shipments],
  );

  const tripByShipment = useMemo(() => {
    const map = new Map<string, NonNullable<typeof trips>[number]>();
    for (const trip of trips ?? []) {
      if (!map.has(trip.shipment_id)) map.set(trip.shipment_id, trip);
    }
    return map;
  }, [trips]);

  const truckById = useMemo(() => {
    const map = new Map<string, string>();
    for (const truck of trucks ?? []) map.set(truck.id, truck.registration_no);
    return map;
  }, [trucks]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return active;
    return active.filter((s) => s.status === filter);
  }, [active, filter]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { ALL: active.length };
    for (const item of active) result[item.status] = (result[item.status] ?? 0) + 1;
    return result;
  }, [active]);

  const newAssignments = (shipments ?? []).filter((s) => s.status === "SUBMITTED").length;
  const pendingRequests = (assignments ?? []).filter((a) => ["REQUESTED", "OFFERED"].includes(a.status)).length;

  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-[1400px] animate-fade space-y-7">
      <Seo
        title="Active trips · PortBackhaul"
        description="Clearing agent dashboard."
        path="/app/agent/trips"
        noIndex
      />

      <PageHeader
        eyebrow="Clearing Agent Dashboard"
        title={`Welcome back, ${profile?.full_name ?? "there"}`}
        subtitle={profile?.company_name ?? undefined}
        meta={
          <div className="tabular">
            <div>
              {now.toLocaleDateString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
            <div>{now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={FileText}
          label="New Assignments"
          value={newAssignments}
          to="/app/agent/new-cargo"
          tone="verified"
        />
        <MetricCard
          icon={Truck}
          label="Active Shipments"
          value={active.length}
          to="/app/agent/trips"
          tone="progress"
        />
        <MetricCard
          icon={Clock}
          label="Pending Truck Requests"
          value={pendingRequests}
          to="/app/agent/request-truck"
          tone="pending"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const count = counts[item.key] ?? 0;
          if (item.key !== "ALL" && count === 0) return null;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className={cn(
                "rounded-md border px-3.5 py-2 text-sm font-medium transition-all",
                filter === item.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40",
              )}
            >
              {item.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="panel overflow-hidden">
        {isError ? (
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="shipments" compact />
        ) : isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading shipments…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No active shipments"
            description="Shipments you have created appear here from the moment they are submitted until delivery."
            action={
              <Button asChild>
                <Link to="/app/agent/new-cargo">View new cargo</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <Th>Cargo ID</Th>
                  <Th>Route</Th>
                  <Th>Status</Th>
                  <Th>Truck</Th>
                  <Th>Driver</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((shipment) => {
                  const trip = tripByShipment.get(shipment.id);
                  return (
                    <tr key={shipment.id} className="data-grid-row">
                      <Td>
                        <span className="flex items-center gap-2">
                          <span className="font-mono font-semibold tabular">{shipment.cargo_ref}</span>
                          {shipment.is_demo ? <DemoBadge /> : null}
                        </span>
                      </Td>
                      <Td className="text-muted-foreground">
                        {shipment.pickup_location_text ?? "—"} → {shipment.destination_city ?? "—"}
                      </Td>
                      <Td>
                        <StatusBadge status={shipment.status} raw />
                      </Td>
                      <Td className="font-mono tabular text-muted-foreground">
                        {trip ? (truckById.get(trip.truck_id) ?? "—") : "—"}
                      </Td>
                      <Td className="text-muted-foreground">
                        {trip ? (drivers?.[trip.driver_id]?.name ?? "Assigned") : "—"}
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/app/shipments/${shipment.id}`}>View</Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`More actions for ${shipment.cargo_ref}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/app/shipments/${shipment.id}`}>Open shipment</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/app/agent/request-truck?shipment=${shipment.id}`}>
                                  Request truck
                                </Link>
                              </DropdownMenuItem>
                              {trip ? (
                                <DropdownMenuItem asChild>
                                  <Link to={`/app/trips/${trip.id}`}>Open trip</Link>
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5">
          <p className="text-sm text-muted-foreground">
            Showing {filtered.length} of {active.length} shipments
          </p>
          <Button asChild>
            <Link to="/app/agent/request-truck">
              <Truck className="mr-2 h-4 w-4" />
              Request Truck
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  to,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  to: string;
  tone: "verified" | "progress" | "pending";
}) {
  const toneClass =
    tone === "verified"
      ? "bg-status-verified-bg text-status-verified"
      : tone === "progress"
        ? "bg-status-progress-bg text-status-progress"
        : "bg-status-pending-bg text-status-pending";

  return (
    <Link
      to={to}
      className="panel group flex items-center gap-4 p-5 transition-all hover:border-primary/40 hover:shadow-[0_2px_8px_rgba(27,38,59,0.08)]"
    >
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", toneClass)}>
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-muted-foreground">{label}</span>
        <span className="mt-0.5 block text-3xl font-extrabold tabular">{value}</span>
      </span>
      <ArrowRight
        className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-5 py-4 align-middle", className)}>{children}</td>;
}