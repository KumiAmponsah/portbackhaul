import { ArrowLeft, CreditCard, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { MomoPaymentDialog, type MomoPaymentTarget } from "@/components/MomoPaymentDialog";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { RouteMap } from "@/components/RouteMap";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useDriverDirectory, useTrucks } from "@/hooks/use-fleet";
import { useShipment } from "@/hooks/use-shipments";
import { useTripPayment } from "@/hooks/use-trip-payment";
import { useIssueDeliveryOtp, useTrip, useTripHistory, useTripLocations } from "@/hooks/use-trips";
import { useRoute } from "@/hooks/use-route"; 
import { describeError } from "@/lib/errors";
import { formatDateTime, formatGhs, formatTime } from "@/lib/format";
import { statusLabel } from "@/lib/status";

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: trip, isLoading, isError, error, refetch } = useTrip(id);
  const { data: shipment } = useShipment(trip?.shipment_id);
  const { data: trucks } = useTrucks();
  const { data: drivers } = useDriverDirectory();
  const { data: history } = useTripHistory(id);
  const { data: locations } = useTripLocations(id);

  // Fetch the real road geometry from Mapbox
  const { data: route } = useRoute(
    trip?.pickup_lat && trip?.pickup_lng ? { lat: trip.pickup_lat, lng: trip.pickup_lng } : null,
    trip?.destination_lat && trip?.destination_lng ? { lat: trip.destination_lat, lng: trip.destination_lng } : null,
  );

  const { data: tripPayment } = useTripPayment(trip?.id);

  const issueOtp = useIssueDeliveryOtp();
  const [otp, setOtp] = useState<string | null>(null);

  const [paymentTarget, setPaymentTarget] = useState<MomoPaymentTarget | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const truck = useMemo(() => (trucks ?? []).find((t) => t.id === trip?.truck_id) ?? null, [trucks, trip]);
  const driver = trip ? (drivers?.[trip.driver_id] ?? null) : null;
  const lastPing = locations?.[locations.length - 1] ?? null;

  if (isError) {
    return (
      <div className="p-8">
        <QueryErrorState error={error} onRetry={() => void refetch()} subject="this trip" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading trip…
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <h1 className="mt-3 text-lg font-bold">Trip not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">You are not authorised to view this trip.</p>
        <Button asChild className="mt-5" variant="outline">
          <Link to="/app">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const isOwningAgent = profile?.role === "CLEARING_AGENT";
  const canIssueOtp = isOwningAgent && trip.status === "ARRIVED_DESTINATION";

  const canPay =
    isOwningAgent &&
    Boolean(tripPayment) &&
    tripPayment!.payer_id === profile?.id &&
    ["PENDING", "FAILED"].includes(tripPayment!.status);

  const paymentSettled =
    Boolean(tripPayment) && ["PAID", "HELD", "RELEASED", "AUTHORIZED"].includes(tripPayment!.status);

  async function handleIssueOtp() {
    try {
      const code = await issueOtp.mutateAsync(trip!.id);
      setOtp(code);
      toast.success("Delivery code issued. Share it with the driver on arrival.");
    } catch (error) {
      toast.error(describeError(error));
    }
  }

  function handleOpenPay() {
    if (!tripPayment) {
      toast.error("No payment record exists for this trip yet. Ask the administrator to create it.");
      return;
    }
    setPaymentTarget({
      paymentId: tripPayment.id,
      amountGhs: Number(tripPayment.amount_ghs),
      label: `Trip ${trip!.trip_ref} · ${trip!.pickup_location_text ?? ""} → ${trip!.destination_text ?? ""}`,
    });
    setPaymentOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-6">
      <Seo title={`${trip.trip_ref} · PortBackhaul`} description="Trip record." path={`/app/trips/${trip.id}`} noIndex />

      <Link to="/app" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back
      </Link>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono tabular">{trip.trip_ref}</span>
            <StatusBadge status={trip.status} raw className="text-xs" />
          </span>
        }
        subtitle={`${trip.pickup_location_text} → ${trip.destination_text}`}
        meta={<span className="font-mono text-lg font-extrabold tabular">{formatGhs(trip.transport_fee_ghs)}</span>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canIssueOtp ? (
              <Button onClick={() => void handleIssueOtp()} disabled={issueOtp.isPending}>
                {issueOtp.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                Issue delivery code
              </Button>
            ) : null}

            {canPay ? (
              <Button variant="outline" onClick={handleOpenPay}>
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

      {otp ? (
        <div className="panel border-primary/40 bg-primary/5 p-6 text-center">
          <p className="eyebrow">Delivery code</p>
          <p className="mt-2 font-mono text-4xl font-extrabold tracking-[0.3em] tabular text-primary">{otp}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Give this to the person receiving the cargo. The driver enters it to confirm delivery.
          </p>
        </div>
      ) : null}

      <RouteMap
        pickup={trip.pickup_lat && trip.pickup_lng ? { lat: trip.pickup_lat, lng: trip.pickup_lng, label: trip.pickup_location_text ?? undefined } : null}
        destination={trip.destination_lat && trip.destination_lng ? { lat: trip.destination_lat, lng: trip.destination_lng, label: trip.destination_text ?? undefined } : null}
        trail={(locations ?? []).map((l) => ({ lat: l.latitude, lng: l.longitude }))}
        current={lastPing ? { lat: lastPing.latitude, lng: lastPing.longitude } : null}
        routeGeometry={route?.coordinates}
        lastUpdated={lastPing?.recorded_at ?? null}
        driver={driver ? { 
          name: driver.name ?? "Driver", 
          phone: driver.phone ?? undefined, 
          truckReg: truck?.registration_no ?? undefined,
          truckType: truck?.truck_type
        } : null}
        height={450}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="panel p-6">
          <h2 className="text-base font-bold">Status history</h2>
          <ol className="mt-5 space-y-4">
            {(history ?? []).map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{statusLabel(event.new_status)}</p>
                  {event.note ? <p className="mt-0.5 text-sm text-muted-foreground">{event.note}</p> : null}
                </div>
                <span className="shrink-0 font-mono text-xs tabular text-muted-foreground">
                  {formatTime(event.created_at)}
                </span>
              </li>
            ))}
            {(history ?? []).length === 0 ? <li className="text-sm text-muted-foreground">No status events recorded yet.</li> : null}
          </ol>
        </section>

        <aside className="space-y-5">
          <section className="panel p-5">
            <h2 className="text-base font-bold">Assignment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Cargo" value={shipment?.cargo_ref ?? "—"} mono />
              <Row label="Driver" value={driver?.name ?? "—"} />
              <Row label="Phone" value={driver?.phone ?? "—"} mono />
              <Row label="Truck" value={truck?.registration_no ?? "—"} mono />
              <Row label="Assigned" value={formatDateTime(trip.assigned_at)} />
              <Row label="Started" value={trip.started_at ? formatDateTime(trip.started_at) : "—"} />
            </dl>
          </section>

          <section className="panel p-5">
            <h2 className="text-base font-bold">Payment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Amount" value={tripPayment ? formatGhs(Number(tripPayment.amount_ghs)) : "—"} mono />
              <Row label="Status" value={tripPayment?.status ?? "No payment record"} />
              <Row label="Reference" value={tripPayment?.provider_reference ?? "—"} mono />
            </dl>
            {canPay ? (
              <Button variant="outline" className="mt-4 w-full" onClick={handleOpenPay}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            ) : null}
          </section>

          {shipment ? (
            <Button asChild variant="outline" className="w-full">
              <Link to={`/app/shipments/${shipment.id}`}>Open shipment</Link>
            </Button>
          ) : null}
        </aside>
      </div>

      <MomoPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        target={paymentTarget}
        onSettled={() => {
          void queryClient.invalidateQueries({ queryKey: ["trip-payment", trip.id] });
          void queryClient.invalidateQueries({ queryKey: ["payments"] });
          void queryClient.invalidateQueries({ queryKey: ["momo-transactions"] });
        }}
      />
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 truncate text-right font-medium ${mono ? "font-mono tabular" : ""}`}>{value}</dd>
    </div>
  );
}