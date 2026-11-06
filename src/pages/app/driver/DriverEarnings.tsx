import { CircleDollarSign, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { usePayouts, useRequestPayout } from "@/hooks/use-payments";
import { useTrips } from "@/hooks/use-trips";
import { describeError } from "@/lib/errors";
import { formatDate, formatGhs } from "@/lib/format";

export default function DriverEarnings() {
  const { data: payouts, isLoading, isError, error, refetch } = usePayouts();
  const { data: trips } = useTrips();
  const requestPayout = useRequestPayout();
  const [busyId, setBusyId] = useState<string | null>(null);

  const tripRef = useMemo(() => {
    const map = new Map<string, string>();
    for (const trip of trips ?? []) map.set(trip.id, trip.trip_ref);
    return map;
  }, [trips]);

  const totals = useMemo(() => {
    const rows = payouts ?? [];
    return {
      paid: rows.filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount_ghs), 0),
      pending: rows
        .filter((p) => !["PAID", "CANCELLED", "FAILED"].includes(p.status))
        .reduce((sum, p) => sum + Number(p.amount_ghs), 0),
    };
  }, [payouts]);

  async function handleRequest(payoutId: string) {
    setBusyId(payoutId);
    try {
      await requestPayout.mutateAsync(payoutId);
      toast.success("Payout requested. An administrator will process it.");
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[900px] animate-fade space-y-6">
      <Seo title="Earnings · PortBackhaul" description="Your trip earnings and payouts." path="/app/driver/earnings" noIndex />

      <PageHeader eyebrow="Driver" title="Earnings" subtitle="Your share after the platform commission." />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="text-sm font-medium text-muted-foreground">Paid out</p>
          <p className="mt-1 font-mono text-3xl font-extrabold tabular text-status-verified">{formatGhs(totals.paid)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-medium text-muted-foreground">Awaiting payout</p>
          <p className="mt-1 font-mono text-3xl font-extrabold tabular text-status-pending">{formatGhs(totals.pending)}</p>
        </div>
      </div>

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="earnings" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading…</div>
      ) : (payouts ?? []).length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={CircleDollarSign}
            title="No earnings yet"
            description="Your earnings appear after a delivery is confirmed on one of your trips."
          />
        </div>
      ) : (
        <div className="panel divide-y divide-border">
          {(payouts ?? []).map((payout) => (
            <div key={payout.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-mono text-sm font-bold tabular">
                  {payout.trip_id ? (tripRef.get(payout.trip_id) ?? "—") : "—"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{formatDate(payout.created_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-lg font-bold tabular">{formatGhs(payout.amount_ghs)}</span>
                <StatusBadge status={payout.status} raw />
                {payout.status === "PENDING" ? (
                  <Button size="sm" variant="outline" onClick={() => void handleRequest(payout.id)} disabled={busyId === payout.id}>
                    {busyId === payout.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                    Request payout
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
