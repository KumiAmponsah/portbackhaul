import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  CreditCard,
  Loader2,
  MapPin,
  ShieldAlert,
  Truck,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { DemoBadge } from "@/components/DemoBadge";
import { MomoPaymentDialog, type MomoPaymentTarget } from "@/components/MomoPaymentDialog";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { RouteMap } from "@/components/RouteMap";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useDriverDirectory, useTrucks } from "@/hooks/use-fleet";
import { usePayments, useRaiseDispute } from "@/hooks/use-payments";
import { useShipment, useUpdateOperationalStatus } from "@/hooks/use-shipments";
import { useTripPayment } from "@/hooks/use-trip-payment";
import { useTripHistory, useTripLocations, useTrips } from "@/hooks/use-trips";
import { supabase } from "@/integrations/supabase/client";
import { CUSTOMS_DISCLAIMER } from "@/lib/customsIntegration";
import { describeError } from "@/lib/errors";
import { formatDate, formatGhs, formatTime, formatWeight } from "@/lib/format";
import { statusLabel } from "@/lib/status";

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();

  const { data: shipment, isLoading, isError, error, refetch } = useShipment(id);
  const { data: trips } = useTrips();
  const { data: trucks } = useTrucks();
  const { data: drivers } = useDriverDirectory();
  const { data: payments } = usePayments();

  const trip = useMemo(() => (trips ?? []).find((t) => t.shipment_id === id) ?? null, [trips, id]);
  const { data: tripPayment } = useTripPayment(trip?.id);
  const { data: history } = useTripHistory(trip?.id);
  const { data: locations } = useTripLocations(trip?.id);

  const updateStatus = useUpdateOperationalStatus();
  const raiseDispute = useRaiseDispute();

  const [disputeOpen, setDisputeOpen] = useState<boolean>(false);
  const [disputeCategory, setDisputeCategory] = useState<string>("DELAY");
  const [disputeText, setDisputeText] = useState<string>("");

  // Pay Now dialog state
  const [paymentTarget, setPaymentTarget] = useState<MomoPaymentTarget | null>(null);
  const [paymentOpen, setPaymentOpen] = useState<boolean>(false);

  if (isError) {
    return (
      <div className="p-8">
        <QueryErrorState error={error} onRetry={() => void refetch()} subject="this shipment" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading shipment…
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <h1 className="mt-3 text-lg font-bold">Shipment not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This shipment does not exist, or you are not authorised to view it.
        </p>
        <Button asChild className="mt-5" variant="outline">
          <Link to="/app">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const truck = trip ? (trucks ?? []).find((t) => t.id === trip.truck_id) ?? null : null;
  const driver = trip ? drivers?.[trip.driver_id] ?? null : null;
  const payment = (payments ?? []).find((p) => p.shipment_id === shipment.id) ?? null;
  const lastPing = locations?.[locations.length - 1] ?? null;

  const isAgent = profile?.role === "CLEARING_AGENT" && shipment.clearing_agent_id === profile.id;
  const backTo = isAgent ? "/app/agent/trips" : "/app/shipments";

  const canPay =
    isAgent &&
    Boolean(tripPayment) &&
    tripPayment!.payer_id === profile?.id &&
    ["PENDING", "FAILED"].includes(tripPayment!.status);

  const paymentSettled =
    Boolean(tripPayment) && ["PAID", "HELD", "RELEASED", "AUTHORIZED"].includes(tripPayment!.status);

  function handleOpenPay() {
    if (!tripPayment) {
      toast.error("No payment record exists for this trip yet.");
      return;
    }
    setPaymentTarget({
      paymentId: tripPayment.id,
      amountGhs: Number(tripPayment.amount_ghs),
      label: `Shipment ${shipment!.cargo_ref} · ${shipment!.pickup_location_text ?? ""} → ${shipment!.destination_city ?? ""}`,
    });
    setPaymentOpen(true);
  }

  async function handleOperationalStatus(status: string) {
    try {
      await updateStatus.mutateAsync({ shipmentId: shipment!.id, status });
      toast.success(`Shipment marked ${statusLabel(status)}`);
    } catch (error) {
      toast.error(describeError(error));
    }
  }

  async function handleDispute() {
    if (!disputeText.trim()) {
      toast.error("Describe the issue so it can be reviewed.");
      return;
    }
    try {
      await raiseDispute.mutateAsync({
        tripId: trip?.id ?? null,
        shipmentId: shipment!.id,
        category: disputeCategory,
        description: disputeText.trim(),
      });
      toast.success("Issue reported. An administrator will review it.");
      setDisputeOpen(false);
      setDisputeText("");
    } catch (error) {
      toast.error(describeError(error));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] animate-fade space-y-6">
      <Seo
        title={`${shipment.cargo_ref} · PortBackhaul`}
        description="Shipment details and live trip tracking."
        path={`/app/shipments/${shipment.id}`}
        noIndex
      />

      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to={backTo} className="inline-flex items-center gap-1.5 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {isAgent ? "Active Trips" : "My Shipments"}
        </Link>
        <span aria-hidden>›</span>
        <span className="font-mono font-semibold text-foreground tabular">{shipment.cargo_ref}</span>
      </nav>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono tabular">{shipment.cargo_ref}</span>
            <StatusBadge status={shipment.status} raw className="text-xs" />
            {shipment.is_demo ? <DemoBadge /> : null}
          </span>
        }
        meta={
          <div className="tabular">
            <div>Updated {formatDate(shipment.updated_at)}</div>
            <div>{formatTime(shipment.updated_at)}</div>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isAgent && ["SUBMITTED", "CLEARANCE_IN_PROGRESS"].includes(shipment.status) ? (
              <Button onClick={() => void handleOperationalStatus("READY_FOR_TRANSPORT")} disabled={updateStatus.isPending}>
                Mark ready for transport
              </Button>
            ) : null}
            {canPay ? (
              <Button onClick={handleOpenPay}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            ) : null}
            {paymentSettled ? (
              <span className="inline-flex items-center rounded-full border border-status-verified/40 bg-status-verified-bg px-3 py-1.5 text-xs font-semibold text-status-verified">
                Payment {tripPayment!.status}
              </span>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <InfoPanel icon={Box} title="Cargo details" tone="verified">
          <Row label="Cargo" value={`${shipment.description}${shipment.quantity ? `, ${shipment.quantity} ${shipment.quantity_unit ?? ""}` : ""}`} />
          <Row label="Container" value={shipment.container_number ?? "—"} mono />
          <Row label="Cargo type" value={shipment.cargo_type.replace(/_/g, " ")} />
          <Row label="Weight" value={formatWeight(shipment.weight_kg)} />
        </InfoPanel>

        <InfoPanel icon={MapPin} title="Consignee & route" tone="pending">
          <Row label="Consignee" value={shipment.consignee_name ?? "—"} />
          <Row
            label="Route"
            value={`${shipment.pickup_location_text ?? "—"} → ${shipment.destination_city ?? "—"}, ${shipment.destination_country ?? ""}`}
          />
          <Row label="Origin" value={shipment.pickup_location_text ?? "—"} />
          <Row label="Destination" value={`${shipment.destination_city ?? "—"}, ${shipment.destination_country ?? ""}`} />
        </InfoPanel>
      </div>

      {trip ? (
        <RouteMap
          pickup={
            trip.pickup_lat !== null && trip.pickup_lng !== null
              ? { lat: trip.pickup_lat, lng: trip.pickup_lng, label: trip.pickup_location_text ?? undefined }
              : null
          }
          destination={
            trip.destination_lat !== null && trip.destination_lng !== null
              ? { lat: trip.destination_lat, lng: trip.destination_lng, label: trip.destination_text ?? undefined }
              : null
          }
          trail={(locations ?? []).map((l) => ({ lat: l.latitude, lng: l.longitude }))}
          current={lastPing ? { lat: lastPing.latitude, lng: lastPing.longitude } : null}
          lastUpdated={lastPing?.recorded_at ?? null}
          height={360}
        />
      ) : null}

      {trip && (history ?? []).length > 0 ? (
        <section className="panel p-6">
          <h2 className="text-base font-bold">Shipment timeline</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(history ?? []).map((event, index) => {
              const isLast = index === (history ?? []).length - 1;
              return (
                <li key={event.id} className="relative">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isLast ? "bg-status-progress text-white" : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {isLast ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="hidden h-0.5 flex-1 bg-border sm:block" aria-hidden />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{statusLabel(event.new_status)}</p>
                  <p className="mt-0.5 font-mono text-xs tabular text-muted-foreground">{formatTime(event.created_at)}</p>
                  {event.note ? <p className="mt-1 text-xs text-muted-foreground">{event.note}</p> : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="panel p-6">
          <h2 className="text-base font-bold">Driver & truck</h2>
          {trip ? (
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-status-verified-bg text-status-verified">
                  <User className="h-5 w-5" aria-hidden />
                </span>
                <dl className="min-w-0 space-y-1.5 text-sm">
                  <Row label="Driver" value={driver?.name ?? "Assigned"} />
                  <Row label="Phone" value={driver?.phone ?? "—"} mono />
                  <Row label="Verification" value={driver?.verification ?? "—"} />
                </dl>
              </div>
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Truck className="h-5 w-5" aria-hidden />
                </span>
                <dl className="min-w-0 space-y-1.5 text-sm">
                  <Row label="Truck" value={truck?.registration_no ?? "—"} mono />
                  <Row label="Type" value={truck ? truck.truck_type.replace(/_/g, " ") : "—"} />
                  <Row label="Capacity" value={truck ? `${truck.capacity_tons}T` : "—"} />
                </dl>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No truck has been assigned yet. A clearing agent must request a truck and a driver must accept the job.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
            <Button variant="outline" onClick={() => setDisputeOpen(true)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report issue
            </Button>
            {trip ? (
              <Button asChild variant="outline">
                <Link to={`/app/trips/${trip.id}`}>Open trip record</Link>
              </Button>
            ) : null}
            {/* Pay Now replaces the old broken /app/payments link */}
            {trip && canPay ? (
              <Button onClick={handleOpenPay}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            ) : trip && paymentSettled ? (
              <span className="inline-flex items-center rounded-md border border-status-verified/40 bg-status-verified-bg px-3 py-1.5 text-xs font-semibold text-status-verified">
                Payment {tripPayment!.status}
              </span>
            ) : (
              <Button disabled variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Awaiting driver acceptance
              </Button>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel p-6">
            <h2 className="text-base font-bold">Payment</h2>
            {payment || tripPayment ? (
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row
                  label="Amount"
                  value={formatGhs(Number(tripPayment?.amount_ghs ?? payment?.amount_ghs ?? 0))}
                  mono
                />
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge status={tripPayment?.status ?? payment?.status ?? "PENDING"} raw />
                  </dd>
                </div>
                <Row label="Provider" value={payment?.provider ?? "PAYSTACK"} />
                <Row label="Reference" value={tripPayment?.provider_reference ?? payment?.provider_reference ?? "—"} mono />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                A payment record is created automatically when a driver accepts a truck request.
              </p>
            )}
            {canPay ? (
              <Button className="mt-4 w-full" onClick={handleOpenPay}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            ) : null}
          </section>

          <section className="panel p-5">
            <p className="eyebrow mb-2">Customs & port information</p>
            <div className="flex items-start gap-2.5 rounded-md border border-status-neutral/25 bg-status-neutral-bg p-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-neutral" aria-hidden />
              <p className="text-xs leading-relaxed text-status-neutral">
                <span className="font-bold uppercase tracking-wide">Integration not connected.</span> {CUSTOMS_DISCLAIMER}
              </p>
            </div>
          </section>
        </aside>
      </div>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an issue</DialogTitle>
            <DialogDescription>
              Describe the problem. Platform administrators will review it and contact the parties involved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={disputeCategory} onValueChange={setDisputeCategory}>
              <SelectTrigger aria-label="Issue category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAMAGE">Cargo damage</SelectItem>
                <SelectItem value="DELAY">Delay</SelectItem>
                <SelectItem value="PAYMENT">Payment</SelectItem>
                <SelectItem value="NON_DELIVERY">Non-delivery</SelectItem>
                <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              rows={4}
              value={disputeText}
              onChange={(e) => setDisputeText(e.target.value)}
              placeholder="What happened?"
              aria-label="Issue description"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleDispute()} disabled={raiseDispute.isPending}>
              {raiseDispute.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MomoPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        target={paymentTarget}
        onSettled={() => {
          void refetch();
        }}
      />
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: typeof Box;
  title: string;
  tone: "verified" | "pending";
  children: React.ReactNode;
}) {
  return (
    <section className="panel p-6">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
            tone === "verified" ? "bg-status-verified-bg text-status-verified" : "bg-status-pending-bg text-status-pending"
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{title}</h2>
          <dl className="mt-3 space-y-2 text-sm">{children}</dl>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 truncate text-right font-medium ${mono ? "font-mono tabular" : ""}`}>{value}</dd>
    </div>
  );
}