import { Truck } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useTrips } from "@/hooks/use-trips";
import { formatDate, formatGhs } from "@/lib/format";

export default function DriverTrips() {
  const { data: trips, isLoading, isError, error, refetch } = useTrips();
  const rows = trips ?? [];

  return (
    <div className="mx-auto w-full max-w-[900px] animate-fade space-y-6">
      <Seo
        title="My trips · PortBackhaul"
        description="Your trip history."
        path="/app/driver/trips"
        noIndex
      />

      <PageHeader eyebrow="Driver" title="My trips" subtitle="Every trip assigned to you, newest first." />

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="trips" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading trips…</div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState icon={Truck} title="No trips yet" description="Accepted jobs become trips and appear here." />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((trip) => (
            <Link
              key={trip.id}
              to={`/app/driver/trip/${trip.id}`}
              className="panel flex flex-wrap items-center justify-between gap-4 p-5 transition-all hover:border-primary/40"
            >
              <div className="min-w-0">
                <span className="font-mono text-sm font-bold tabular">{trip.trip_ref}</span>
                <p className="mt-1 font-semibold">
                  {trip.pickup_location_text} → {trip.destination_text}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Assigned {formatDate(trip.assigned_at)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono font-bold tabular">{formatGhs(trip.transport_fee_ghs)}</span>
                <StatusBadge status={trip.status} raw />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Button asChild variant="outline">
        <Link to="/app/driver">Back to jobs</Link>
      </Button>
    </div>
  );
}