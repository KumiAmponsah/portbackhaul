import {
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  MapPin,
  Package,
  Send,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  LocationPicker,
  type PickedLocation,
} from "@/components/map/LocationPicker";
import { RoutePreviewMap } from "@/components/map/RoutePreviewMap";
import {
  useCancelAssignment,
  useMatchedTrucks,
  useMyAssignments,
  useRequestTruck,
  type AssignmentWithDetails,
} from "@/hooks/use-assignments";
import { useRoute } from "@/hooks/use-route";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";
import { TRUCK_TYPES } from "@/lib/status";
import { cn } from "@/lib/utils";

/** Categories the agent can pick from. Must match the CHECK constraint on
 *  cargo_shipments.cargo_type (or your DB's accepted values). */
const CARGO_CATEGORIES = [
  { value: "GENERAL", label: "General cargo" },
  { value: "CONTAINERISED", label: "Containerised goods" },
  { value: "BULK", label: "Bulk cargo (cement, grain, etc.)" },
  { value: "REFRIGERATED", label: "Refrigerated goods" },
  { value: "HAZARDOUS", label: "Hazardous materials" },
  { value: "LIQUID", label: "Liquid cargo (fuel, water, etc.)" },
  { value: "VEHICLE", label: "Vehicles / rolling stock" },
] as const;

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

export default function RequestTruck() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: myAssignments, isLoading: loadingMine } = useMyAssignments();
  const requestTruck = useRequestTruck();
  const cancelAssignment = useCancelAssignment();

  const [cargoCategory, setCargoCategory] = useState<string>(
    searchParams.get("category") ?? "",
  );
  const [truckType, setTruckType] = useState<string>("FLATBED");
  const [capacity, setCapacity] = useState<string>("20");
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [pickedOrigin, setPickedOrigin] = useState<PickedLocation | null>(null);
  const [pickedDestination, setPickedDestination] = useState<PickedLocation | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"origin" | "destination" | null>(null);
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("07:00");
  const [notes, setNotes] = useState<string>("");
  const [fee, setFee] = useState<string>("");
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const capacityNumber = Number(capacity) || 0;
  const { data: matches, isLoading: matching } = useMatchedTrucks({
    truckType,
    capacity: capacityNumber,
    lat: pickedOrigin?.lat,
    lng: pickedOrigin?.lng,
    enabled: capacityNumber > 0,
  });

  const { data: route, isFetching: routing } = useRoute(
    pickedOrigin ? { lat: pickedOrigin.lat, lng: pickedOrigin.lng } : null,
    pickedDestination ? { lat: pickedDestination.lat, lng: pickedDestination.lng } : null,
  );

  function handlePickerConfirm(location: PickedLocation) {
    if (pickerTarget === "origin") {
      setPickedOrigin(location);
      setOrigin(location.placeName);
    } else if (pickerTarget === "destination") {
      setPickedDestination(location);
      setDestination(location.placeName);
    }
    setPickerTarget(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cargoCategory) {
      toast.error("Choose a cargo category.");
      return;
    }
    if (!origin.trim() || !destination.trim()) {
      toast.error("Pick both an origin and a destination on the map.");
      return;
    }
    if (!pickupDate) {
      toast.error("Choose a pickup date.");
      return;
    }
    if (capacityNumber <= 0) {
      toast.error("Enter the truck capacity in tons.");
      return;
    }

    setSubmitting(true);
    try {
      // 1) Create a minimal shipment from the category
      const { data: shipmentId, error: createErr } = await supabase.rpc(
        "create_category_shipment",
        {
          p_cargo_type: cargoCategory,
          p_origin_text: origin,
          p_destination: destination,
          p_weight_kg: capacityNumber * 1000,
          p_agent_id: (await supabase.auth.getUser()).data.user?.id,
        },
      );
      if (createErr) throw new Error(describeError(createErr));
      if (!shipmentId) throw new Error("Could not create the shipment.");

      // 2) Fire the truck request against the new shipment
      const pickupAt = pickupDate
        ? new Date(`${pickupDate}T${pickupTime || "07:00"}:00`).toISOString()
        : null;

      const newId = await requestTruck.mutateAsync({
        shipmentId: String(shipmentId),
        truckType,
        capacity: capacityNumber,
        pickupAt,
        origin,
        destination,
        notes: notes || null,
        fee: fee ? Number(fee) : null,
        truckId: selectedTruck,
      });

      setJustCreatedId(newId);
      toast.success(
        selectedTruck
          ? "Truck request sent. The driver has been notified and must accept the job."
          : "Truck request created and open to matching carriers.",
      );

      // Reset the form so the user can make another request
      setSelectedTruck(null);
      setNotes("");
      setFee("");
      setPickedOrigin(null);
      setPickedDestination(null);
      setOrigin("");
      setDestination("");
    } catch (error) {
      toast.error(describeError(error, "Could not send the truck request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] animate-fade space-y-7">
      <Seo
        title="Request truck · PortBackhaul"
        description="Request a verified truck for your cargo category."
        path="/app/agent/request-truck"
        noIndex
      />

      <PageHeader
        eyebrow="Truck Request"
        title="Request a truck"
        subtitle="Pick a cargo category and the route. We'll match you with available verified trucks."
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
      >
        <section className="panel p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">Transport details</h2>
            <span className="text-xs text-muted-foreground">All fields are required</span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Cargo category</Label>
              <Select value={cargoCategory} onValueChange={setCargoCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a cargo category" />
                </SelectTrigger>
                <SelectContent>
                  {CARGO_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="truck-type">Truck type</Label>
              <Select value={truckType} onValueChange={setTruckType}>
                <SelectTrigger id="truck-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRUCK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity (tons)</Label>
              <div className="flex">
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  step="0.5"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="rounded-r-none"
                />
                <span className="flex items-center rounded-r-md border border-l-0 border-input bg-muted px-4 text-sm font-medium text-muted-foreground">
                  Tons
                </span>
              </div>
            </div>

            <div className="relative space-y-3 pl-9 pt-1">
              <div className="relative space-y-1.5">
                <span
                  aria-hidden
                  className="absolute -left-[19px] -bottom-3 top-[7px] w-0 border-l-2 border-dashed border-foreground/30"
                />
                <span
                  aria-hidden
                  className="absolute -left-[26px] top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-emerald-500 ring-1 ring-emerald-500/40"
                />
                <Label>Origin</Label>
                <LocationField
                  value={origin}
                  picked={pickedOrigin}
                  onPick={() => setPickerTarget("origin")}
                  onClear={() => {
                    setOrigin("");
                    setPickedOrigin(null);
                  }}
                  placeholder="Pick a pickup point on the map"
                />
              </div>

              <div className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[19px] -bottom-3 -top-3 w-0 border-l-2 border-dashed border-foreground/30"
                />
                <RoutePreviewMap
                  origin={pickedOrigin ? { lat: pickedOrigin.lat, lng: pickedOrigin.lng } : null}
                  destination={
                    pickedDestination
                      ? { lat: pickedDestination.lat, lng: pickedDestination.lng }
                      : null
                  }
                  route={route ?? null}
                  loading={routing}
                  height={300}
                />
              </div>

              <div className="relative space-y-1.5">
                <span
                  aria-hidden
                  className="absolute -left-[19px] -top-3 h-[19px] w-0 border-l-2 border-dashed border-foreground/30"
                />
                <span
                  aria-hidden
                  className="absolute -left-[26px] top-0 h-3.5 w-3.5 border-2 border-background bg-neutral-900 ring-1 ring-neutral-900/40"
                />
                <Label>Destination</Label>
                <LocationField
                  value={destination}
                  picked={pickedDestination}
                  onPick={() => setPickerTarget("destination")}
                  onClear={() => {
                    setDestination("");
                    setPickedDestination(null);
                  }}
                  placeholder="Pick a drop-off point on the map"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pickup-date">Pickup date</Label>
                <Input
                  id="pickup-date"
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pickup-time">Pickup time</Label>
                <Input
                  id="pickup-time"
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fee">Transport fee offered in (GHS)</Label>
              <Input
                id="fee"
                type="number"
                min={0}
                step="10"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Additional requirements / notes</Label>
              <Textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Requires tarpaulin cover"
              />
            </div>
          </div>
        </section>

        <section className="panel flex flex-col p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold">Matched trucks</h2>
              <span className="rounded bg-status-verified-bg px-2 py-0.5 text-xs font-bold text-status-verified">
                {matches?.length ?? 0} available
              </span>
            </div>
            <Link
              to="/app/agent/available-trucks"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all trucks →
            </Link>
          </div>

          <p className="mt-1.5 text-sm text-muted-foreground">
            {pickedOrigin
              ? `Trucks near ${pickedOrigin.name || "the pickup point"}, sorted by proximity and suitability.`
              : "Sorted by availability, capacity and verification status."}
          </p>

          <div className="mt-5 flex-1 space-y-3">
            {matching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Matching trucks…
              </div>
            ) : (matches ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No verified trucks currently match this type and capacity. You can still send an open request.
              </div>
            ) : (
              (matches ?? []).map((match, index) => {
                const selected = selectedTruck === match.truck_id;
                return (
                  <button
                    key={match.truck_id}
                    type="button"
                    onClick={() => setSelectedTruck(selected ? null : match.truck_id)}
                    aria-pressed={selected}
                    className={cn(
                      "w-full rounded-lg border p-4 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold tabular">
                        {index + 1}
                      </span>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Truck className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-2">
                          <span className="font-mono text-base font-bold tabular">
                            {match.registration_no}
                          </span>
                          {selected ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {match.capacity_tons}T{" "}
                          {match.truck_type.replace(/_/g, " ").toLowerCase()}
                          {match.driver_name ? ` · ${match.driver_name}` : " · no driver linked"}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                              match.driver_verification === "VERIFIED"
                                ? "bg-status-verified-bg text-status-verified"
                                : "bg-status-pending-bg text-status-pending",
                            )}
                          >
                            {match.driver_verification === "VERIFIED"
                              ? "Verified"
                              : "Pending docs"}
                          </span>
                          {match.driver_available === false ? (
                            <span className="rounded bg-status-neutral-bg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-status-neutral">
                              Driver off duty
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="flex items-center gap-1 text-sm font-semibold tabular">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          {match.distance_km !== null ? `${match.distance_km} km` : "—"}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">away</span>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-status-progress/25 bg-status-progress-bg p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-status-progress" aria-hidden />
            <p className="text-xs leading-relaxed text-status-progress">
              Matching is based on location, truck type, capacity, verification status and current
              availability. The driver must accept the job before a trip is created — no automatic
              assignment takes place.
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between lg:col-span-2">
          <Button type="button" variant="outline" onClick={() => navigate("/app/agent/trips")}>
            Go to trips
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send truck request
          </Button>
        </div>
      </form>

      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold">My truck requests</h2>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground tabular">
              {myAssignments?.length ?? 0}
            </span>
          </div>
          {justCreatedId ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-status-verified-bg px-2.5 py-1 text-xs font-bold text-status-verified">
              <CheckCircle2 className="h-3.5 w-3.5" /> New request created
            </span>
          ) : null}
        </div>

        <p className="mt-1.5 text-sm text-muted-foreground">
          Every request you've made on PortBackhaul, with live status and full details.
        </p>

        <div className="mt-5 space-y-3">
          {loadingMine ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your requests…
            </div>
          ) : (myAssignments ?? []).length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              You haven't requested any trucks yet. Fill the form above to get started.
            </div>
          ) : (
            (myAssignments ?? []).map((a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                highlight={a.id === justCreatedId}
                onCancel={() => {
                  if (!confirm("Cancel this truck request?")) return;
                  cancelAssignment.mutate(a.id, {
                    onSuccess: () => toast.success("Request cancelled."),
                    onError: (err) =>
                      toast.error(describeError(err, "Could not cancel the request.")),
                  });
                }}
                cancelling={cancelAssignment.isPending}
              />
            ))
          )}
        </div>
      </section>

      <LocationPicker
        open={pickerTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPickerTarget(null);
        }}
        title={pickerTarget === "destination" ? "Pick destination" : "Pick pickup location"}
        initial={
          pickerTarget === "origin"
            ? pickedOrigin
            : pickerTarget === "destination"
              ? pickedDestination
              : null
        }
        onConfirm={handlePickerConfirm}
      />
    </div>
  );
}

function LocationField({
  value,
  picked,
  onPick,
  onClear,
  placeholder,
}: {
  value: string;
  picked: PickedLocation | null;
  onPick: () => void;
  onClear: () => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-md border border-input bg-card">
      <button
        type="button"
        onClick={onPick}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
      >
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1">
          {value ? (
            <>
              <span className="block truncate text-sm font-medium text-foreground">
                {picked?.name || value}
              </span>
              {picked?.placeName ? (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {picked.placeName}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <span className="shrink-0 text-xs font-semibold text-primary">Change</span>
      </button>
      {value ? (
        <div className="flex justify-end border-t border-border px-2 py-1">
          <button
            type="button"
            onClick={onClear}
            className="rounded px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AssignmentRow({
  assignment,
  highlight,
  onCancel,
  cancelling,
}: {
  assignment: AssignmentWithDetails;
  highlight?: boolean;
  onCancel: () => void;
  cancelling?: boolean;
}) {
  const canCancel =
    assignment.status === "PENDING" ||
    assignment.status === "TRUCK_REQUESTED" ||
    assignment.status === "OPEN";

  return (
    <article
      className={cn(
        "rounded-lg border p-5 transition-all",
        highlight ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Truck className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
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
              {highlight ? (
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                  Just now
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {assignment.shipment?.description ??
                assignment.requirements_notes ??
                "Truck request"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatDateTime(assignment.created_at)}
          </span>
          {canCancel ? (
            <Button type="button" size="sm" variant="outline" disabled={cancelling} onClick={onCancel}>
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Truck type" value={assignment.truck_type.replace(/_/g, " ")} />
        <Detail label="Capacity" value={`${assignment.required_capacity_tons} tons`} />
        <Detail label="Offered fee" value={formatFee(assignment.offered_fee_ghs)} />
        <Detail
          label="Route"
          value={
            assignment.route_origin && assignment.route_destination
              ? `${assignment.route_origin} → ${assignment.route_destination}`
              : assignment.route_origin ?? assignment.route_destination ?? "—"
          }
        />
        <Detail label="Pickup" value={formatDateTime(assignment.pickup_at)} />
        <Detail
          label="Assigned truck"
          value={
            assignment.truck?.registration_no
              ? `${assignment.truck.registration_no}${
                  assignment.truck.capacity_tons ? ` · ${assignment.truck.capacity_tons}T` : ""
                }`
              : "Open — awaiting driver"
          }
        />
        {assignment.driver?.full_name ? (
          <Detail
            label="Driver"
            value={`${assignment.driver.full_name}${
              assignment.driver.phone ? ` · ${assignment.driver.phone}` : ""
            }`}
          />
        ) : null}
        {assignment.requirements_notes ? (
          <Detail
            label="Notes"
            value={assignment.requirements_notes}
            className="sm:col-span-2 lg:col-span-3"
          />
        ) : null}
        {assignment.decline_reason ? (
          <Detail
            label="Decline reason"
            value={assignment.decline_reason}
            className="sm:col-span-2 lg:col-span-3"
          />
        ) : null}
      </dl>
    </article>
  );
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function formatFee(fee: number | null) {
  if (fee === null || fee === undefined) return "—";
  return `GHS ${Number(fee).toLocaleString("en-GH", { minimumFractionDigits: 0 })}`;
}