import { useQuery } from "@tanstack/react-query";
import { FileText, MapPin, ShieldCheck, Truck, Users } from "lucide-react";
import { useMemo } from "react";

import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";
import { formatDate, formatGhs, formatWeight } from "@/lib/format";
import { ROLE_LABEL, type Role } from "@/lib/roles";

/** Admin-scope reads: RLS grants ADMIN_VIEW holders access to every row. */
function useAdminTable<T>(key: string, table: string, columns: string, order: string) {
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ["admin-table", key],
    enabled: hasPermission("ADMIN_VIEW"),
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase
        .from(table as never)
        .select(columns)
        .order(order, { ascending: false })
        .limit(200);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as T[];
    },
  });
}

interface CargoRow {
  id: string;
  cargo_ref: string;
  description: string;
  status: string;
  weight_kg: number | null;
  pickup_location_text: string | null;
  destination_city: string | null;
  transport_fee_ghs: number | null;
  is_demo: boolean;
  created_at: string;
}

export function AdminCargo() {
  const { data, isLoading, isError, error, refetch } = useAdminTable<CargoRow>(
    "cargo",
    "cargo_shipments",
    "id, cargo_ref, description, status, weight_kg, pickup_location_text, destination_city, transport_fee_ghs, is_demo, created_at",
    "created_at",
  );

  return (
    <RecordTable
      seoTitle="Cargo · PortBackhaul Admin"
      path="/admin/cargo"
      eyebrow="Admin Dashboard"
      title="Cargo shipments"
      subtitle="Every shipment recorded on the platform."
      icon={FileText}
      isLoading={isLoading}
      rows={data ?? []}
      error={isError ? error : undefined}
      onRetry={() => void refetch()}
      columns={["Cargo ID", "Description", "Route", "Weight", "Fee", "Status", "Created"]}
      renderRow={(row) => (
        <tr key={row.id} className="data-grid-row">
          <td className="px-5 py-4">
            <span className="flex items-center gap-2">
              <span className="font-mono font-semibold tabular">{row.cargo_ref}</span>
              {row.is_demo ? <DemoBadge /> : null}
            </span>
          </td>
          <td className="px-5 py-4">{row.description}</td>
          <td className="px-5 py-4 text-muted-foreground">
            {row.pickup_location_text ?? "—"} → {row.destination_city ?? "—"}
          </td>
          <td className="px-5 py-4 tabular">{formatWeight(row.weight_kg)}</td>
          <td className="px-5 py-4 font-mono tabular">{formatGhs(row.transport_fee_ghs)}</td>
          <td className="px-5 py-4">
            <StatusBadge status={row.status} raw />
          </td>
          <td className="px-5 py-4 text-muted-foreground tabular">{formatDate(row.created_at)}</td>
        </tr>
      )}
    />
  );
}

interface TruckRow {
  id: string;
  registration_no: string;
  truck_type: string;
  capacity_tons: number;
  verification_status: string;
  is_available: boolean;
  is_demo: boolean;
  created_at: string;
}

export function AdminTrucks() {
  const { data, isLoading, isError, error, refetch } = useAdminTable<TruckRow>(
    "trucks",
    "trucks",
    "id, registration_no, truck_type, capacity_tons, verification_status, is_available, is_demo, created_at",
    "created_at",
  );

  return (
    <RecordTable
      seoTitle="Trucks · PortBackhaul Admin"
      path="/admin/trucks"
      eyebrow="Admin Dashboard"
      title="Registered trucks"
      subtitle="Trucks become bookable only once their documents are verified."
      icon={Truck}
      isLoading={isLoading}
      rows={data ?? []}
      error={isError ? error : undefined}
      onRetry={() => void refetch()}
      columns={["Registration", "Type", "Capacity", "Verification", "Availability", "Registered"]}
      renderRow={(row) => (
        <tr key={row.id} className="data-grid-row">
          <td className="px-5 py-4">
            <span className="flex items-center gap-2">
              <span className="font-mono font-semibold tabular">{row.registration_no}</span>
              {row.is_demo ? <DemoBadge /> : null}
            </span>
          </td>
          <td className="px-5 py-4 text-muted-foreground">{row.truck_type.replace(/_/g, " ")}</td>
          <td className="px-5 py-4 tabular">{row.capacity_tons}T</td>
          <td className="px-5 py-4">
            <StatusBadge status={row.verification_status} raw />
          </td>
          <td className="px-5 py-4">
            <StatusBadge status={row.is_available ? "APPROVED" : "PENDING"} />
          </td>
          <td className="px-5 py-4 text-muted-foreground tabular">{formatDate(row.created_at)}</td>
        </tr>
      )}
    />
  );
}

interface DriverRow {
  id: string;
  licence_no: string | null;
  licence_expiry: string | null;
  verification_status: string;
  is_available: boolean;
  completed_trips: number;
  created_at: string;
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
}

export function AdminDrivers() {
  const { hasPermission } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-table", "drivers"],
    enabled: hasPermission("ADMIN_VIEW"),
    queryFn: async (): Promise<DriverRow[]> => {
      const { data: rows, error } = await supabase
        .from("drivers")
        .select(
          "id, licence_no, licence_expiry, verification_status, is_available, completed_trips, created_at, profiles:profile_id (full_name, email, phone)",
        )
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (rows ?? []) as unknown as DriverRow[];
    },
  });

  return (
    <RecordTable
      seoTitle="Drivers · PortBackhaul Admin"
      path="/admin/drivers"
      eyebrow="Admin Dashboard"
      title="Drivers"
      subtitle="Driver verification governs whether they can be matched to cargo."
      icon={Users}
      isLoading={isLoading}
      rows={data ?? []}
      error={isError ? error : undefined}
      onRetry={() => void refetch()}
      columns={["Driver", "Licence", "Expiry", "Trips", "Verification", "Duty"]}
      renderRow={(row) => (
        <tr key={row.id} className="data-grid-row">
          <td className="px-5 py-4">
            <p className="font-semibold">{row.profiles?.full_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{row.profiles?.phone ?? row.profiles?.email ?? ""}</p>
          </td>
          <td className="px-5 py-4 font-mono tabular">{row.licence_no ?? "—"}</td>
          <td className="px-5 py-4 text-muted-foreground tabular">{formatDate(row.licence_expiry)}</td>
          <td className="px-5 py-4 tabular">{row.completed_trips}</td>
          <td className="px-5 py-4">
            <StatusBadge status={row.verification_status} raw />
          </td>
          <td className="px-5 py-4">
            <StatusBadge status={row.is_available ? "APPROVED" : "PENDING"} />
          </td>
        </tr>
      )}
    />
  );
}

interface AgentRow {
  id: string;
  company_name: string;
  licence_no: string | null;
  office_location: string | null;
  is_accepting_work: boolean;
  created_at: string;
  profiles: { full_name: string | null; email: string | null; account_status: string } | null;
}

export function AdminClearingAgents() {
  const { hasPermission } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-table", "clearing-agents"],
    enabled: hasPermission("ADMIN_VIEW"),
    queryFn: async (): Promise<AgentRow[]> => {
      const { data: rows, error } = await supabase
        .from("clearing_agents")
        .select(
          "id, company_name, licence_no, office_location, is_accepting_work, created_at, profiles:profile_id (full_name, email, account_status)",
        )
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (rows ?? []) as unknown as AgentRow[];
    },
  });

  return (
    <RecordTable
      seoTitle="Clearing agents · PortBackhaul Admin"
      path="/admin/clearing-agents"
      eyebrow="Admin Dashboard"
      title="Clearing agents"
      subtitle="Licensed agents who handle clearance workflow and arrange transport."
      icon={ShieldCheck}
      isLoading={isLoading}
      rows={data ?? []}
      error={isError ? error : undefined}
      onRetry={() => void refetch()}
      columns={["Company", "Contact", "Licence", "Office", "Account", "Registered"]}
      renderRow={(row) => (
        <tr key={row.id} className="data-grid-row">
          <td className="px-5 py-4 font-semibold">{row.company_name}</td>
          <td className="px-5 py-4 text-muted-foreground">{row.profiles?.full_name ?? "—"}</td>
          <td className="px-5 py-4 font-mono tabular">{row.licence_no ?? "—"}</td>
          <td className="px-5 py-4 text-muted-foreground">{row.office_location ?? "—"}</td>
          <td className="px-5 py-4">
            <StatusBadge status={row.profiles?.account_status ?? "PENDING"} raw />
          </td>
          <td className="px-5 py-4 text-muted-foreground tabular">{formatDate(row.created_at)}</td>
        </tr>
      )}
    />
  );
}

interface TripRow {
  id: string;
  trip_ref: string;
  status: string;
  pickup_location_text: string | null;
  destination_text: string | null;
  transport_fee_ghs: number | null;
  assigned_at: string;
  is_demo: boolean;
}

export function AdminTrips() {
  const { data, isLoading, isError, error, refetch } = useAdminTable<TripRow>(
    "trips",
    "trip_assignments",
    "id, trip_ref, status, pickup_location_text, destination_text, transport_fee_ghs, assigned_at, is_demo",
    "assigned_at",
  );

  const active = useMemo(
    () => (data ?? []).filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status)).length,
    [data],
  );

  return (
    <RecordTable
      seoTitle="Trips · PortBackhaul Admin"
      path="/admin/trips"
      eyebrow="Admin Dashboard"
      title="Trips"
      subtitle={`${active} active of ${(data ?? []).length} total trips.`}
      icon={MapPin}
      isLoading={isLoading}
      rows={data ?? []}
      error={isError ? error : undefined}
      onRetry={() => void refetch()}
      columns={["Trip", "Route", "Fee", "Status", "Assigned"]}
      renderRow={(row) => (
        <tr key={row.id} className="data-grid-row">
          <td className="px-5 py-4">
            <span className="flex items-center gap-2">
              <span className="font-mono font-semibold tabular">{row.trip_ref}</span>
              {row.is_demo ? <DemoBadge /> : null}
            </span>
          </td>
          <td className="px-5 py-4 text-muted-foreground">
            {row.pickup_location_text} → {row.destination_text}
          </td>
          <td className="px-5 py-4 font-mono tabular">{formatGhs(row.transport_fee_ghs)}</td>
          <td className="px-5 py-4">
            <StatusBadge status={row.status} raw />
          </td>
          <td className="px-5 py-4 text-muted-foreground tabular">{formatDate(row.assigned_at)}</td>
        </tr>
      )}
    />
  );
}

interface RecordTableProps<T> {
  seoTitle: string;
  path: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: typeof FileText;
  error?: unknown;
  onRetry?: () => void;
  isLoading: boolean;
  rows: T[];
  columns: string[];
  renderRow: (row: T) => React.ReactNode;
}

function RecordTable<T>({
  seoTitle,
  path,
  eyebrow,
  title,
  subtitle,
  icon,
  error,
  onRetry,
  isLoading,
  rows,
  columns,
  renderRow,
}: RecordTableProps<T>) {
  return (
    <div className="mx-auto w-full max-w-[1400px] animate-fade space-y-6">
      <Seo title={seoTitle} description={subtitle} path={path} noIndex />
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <div className="panel overflow-hidden">
        {error && onRetry ? (
          <QueryErrorState error={error} onRetry={onRetry} subject="records" compact />
        ) : isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading records…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={icon} title="No records yet" description="Records appear here as the platform is used." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{rows.map(renderRow)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export { ROLE_LABEL, type Role };
