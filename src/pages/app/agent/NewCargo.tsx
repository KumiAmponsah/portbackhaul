import { CheckCircle2, FileText, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAcceptCargoAssignment, useShipments } from "@/hooks/use-shipments";
import { describeError } from "@/lib/errors";
import { formatDate, formatWeight } from "@/lib/format";

export default function NewCargo() {
  const { data: shipments, isLoading, isError, error, refetch } = useShipments();
  const accept = useAcceptCargoAssignment();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = (shipments ?? []).filter((s) => s.status === "SUBMITTED");

  async function handleAccept(id: string) {
    setBusyId(id);
    try {
      await accept.mutateAsync(id);
      toast.success("Assignment accepted. Clearance is now in progress.");
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] animate-fade space-y-7">
      <Seo
        title="New cargo · PortBackhaul"
        description="Cargo waiting for clearance to begin."
        path="/app/agent/new-cargo"
        noIndex
      />

      <PageHeader
        eyebrow="Clearing Agent"
        title="New cargo assignments"
        subtitle="Shipments you have registered that are waiting for you to start the clearance workflow."
      />

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="cargo assignments" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading…</div>
      ) : pending.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={FileText}
            title="No new assignments"
            description="Create a shipment to begin the clearance workflow. It will appear here until you accept it."
            action={
              <Button asChild>
                <Link to="/app/agent/request-truck">
                  <Plus className="mr-2 h-4 w-4" />
                  Get started
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {pending.map((shipment) => (
            <article key={shipment.id} className="panel animate-rise p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-bold tabular">{shipment.cargo_ref}</span>
                    <StatusBadge status={shipment.status} raw />
                    {shipment.is_demo ? <DemoBadge /> : null}
                  </div>
                  <h2 className="mt-2 text-lg font-bold">{shipment.description}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {shipment.pickup_location_text ?? "—"} → {shipment.destination_city ?? "—"},{" "}
                    {shipment.destination_country ?? "—"}
                  </p>
                </div>

                <Button onClick={() => void handleAccept(shipment.id)} disabled={busyId === shipment.id}>
                  {busyId === shipment.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Accept assignment
                </Button>
              </div>

              <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Cargo type" value={shipment.cargo_type.replace(/_/g, " ")} />
                <Field label="Weight" value={formatWeight(shipment.weight_kg)} />
                <Field label="Container" value={shipment.container_number ?? "—"} mono />
                <Field label="Expected pickup" value={formatDate(shipment.expected_pickup_date)} />
                <Field label="Consignee" value={shipment.consignee_name ?? "—"} />
                <Field label="Contact" value={shipment.contact_person ?? "—"} />
                <Field label="Contact phone" value={shipment.contact_phone ?? "—"} mono />
                <Field label="Instructions" value={shipment.special_instructions ?? "None"} />
              </dl>

              <div className="mt-4 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/app/shipments/${shipment.id}`}>View full details</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow mb-1">{label}</dt>
      <dd className={mono ? "truncate font-mono text-sm tabular" : "truncate text-sm font-medium"}>{value}</dd>
    </div>
  );
}