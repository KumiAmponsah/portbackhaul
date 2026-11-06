import { CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useShipments } from "@/hooks/use-shipments";
import { useTrips } from "@/hooks/use-trips";
import { formatDate, formatGhs } from "@/lib/format";

const DONE = ["DELIVERED", "COMPLETED", "CANCELLED"];

export default function CompletedTrips() {
  const { data: shipments, isLoading, isError, error, refetch } = useShipments();
  const { data: trips } = useTrips();

  const completed = useMemo(() => (shipments ?? []).filter((s) => DONE.includes(s.status)), [shipments]);

  const tripByShipment = useMemo(() => {
    const map = new Map<string, NonNullable<typeof trips>[number]>();
    for (const trip of trips ?? []) if (!map.has(trip.shipment_id)) map.set(trip.shipment_id, trip);
    return map;
  }, [trips]);

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-7">
      <Seo title="Completed · PortBackhaul" description="Completed and delivered shipments." path="/app/agent/completed" noIndex />

      <PageHeader eyebrow="Archive" title="Completed shipments" subtitle="Delivered, completed and cancelled records." />

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="completed shipments" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading…</div>
      ) : completed.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={CheckCircle2}
            title="Nothing completed yet"
            description="Once shipments are delivered and closed out, they are archived here."
          />
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Cargo ID</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Route</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Fee</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Closed</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {completed.map((shipment) => {
                const trip = tripByShipment.get(shipment.id);
                return (
                  <tr key={shipment.id} className="data-grid-row">
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2">
                        <span className="font-mono font-semibold tabular">{shipment.cargo_ref}</span>
                        {shipment.is_demo ? <DemoBadge /> : null}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {shipment.pickup_location_text ?? "—"} → {shipment.destination_city ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={shipment.status} raw />
                    </td>
                    <td className="px-5 py-4 font-mono tabular">{formatGhs(shipment.transport_fee_ghs)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(shipment.updated_at)}</td>
                    <td className="px-5 py-4 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={trip ? `/app/trips/${trip.id}` : `/app/shipments/${shipment.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
