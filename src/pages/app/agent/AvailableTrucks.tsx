import { Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDriverDirectory, useTrucks } from "@/hooks/use-fleet";
import { relativeTime } from "@/lib/format";
import { TRUCK_TYPES } from "@/lib/status";

export default function AvailableTrucks() {
  const { data: trucks, isLoading, isError, error, refetch } = useTrucks();
  const { data: drivers } = useDriverDirectory();

  const [search, setSearch] = useState<string>("");
  const [type, setType] = useState<string>("ALL");

  const driverByTruck = useMemo(() => {
    const map = new Map<string, { name: string | null; verification: string }>();
    for (const entry of Object.values(drivers ?? {})) {
      if (entry.truckId) map.set(entry.truckId, { name: entry.name, verification: entry.verification });
    }
    return map;
  }, [drivers]);

  const filtered = useMemo(() => {
    return (trucks ?? []).filter((truck) => {
      if (type !== "ALL" && truck.truck_type !== type) return false;
      if (!search.trim()) return true;
      const needle = search.toLowerCase();
      return (
        truck.registration_no.toLowerCase().includes(needle) ||
        (truck.make_model ?? "").toLowerCase().includes(needle)
      );
    });
  }, [trucks, type, search]);

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-7">
      <Seo title="Available trucks · PortBackhaul" description="Verified trucks available for assignment." path="/app/agent/available-trucks" noIndex />

      <PageHeader
        eyebrow="Fleet"
        title="Available verified trucks"
        subtitle="Only trucks whose documents have been verified by platform administrators are shown."
        actions={
          <Button asChild>
            <Link to="/app/agent/request-truck">Request a truck</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Search registration or model"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search trucks"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-56" aria-label="Filter by truck type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All truck types</SelectItem>
            {TRUCK_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {item.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="trucks" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading trucks…</div>
      ) : filtered.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={Truck}
            title="No trucks match"
            description="Adjust your filters, or send an open truck request that any matching carrier can accept."
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((truck) => {
            const driver = driverByTruck.get(truck.id);
            return (
              <article key={truck.id} className="panel animate-rise p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-base font-bold tabular">{truck.registration_no}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {truck.capacity_tons}T {truck.truck_type.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Truck className="h-5 w-5" aria-hidden />
                  </span>
                </div>

                <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  <Row label="Driver" value={driver?.name ?? "Not linked"} />
                  <Row label="Model" value={truck.make_model ?? "—"} />
                  <Row label="Trailer" value={truck.trailer_info ?? "—"} />
                  <Row label="Last seen" value={relativeTime(truck.location_updated_at)} />
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusBadge status={truck.verification_status} raw />
                  <StatusBadge status={truck.is_available ? "APPROVED" : "PENDING"} raw={false} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium">{value}</dd>
    </div>
  );
}
