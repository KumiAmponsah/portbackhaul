import { ScrollText, Search } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { useAuditLogs } from "@/hooks/use-admin";
import { formatDateTime } from "@/lib/format";

export default function AdminAuditLogs() {
  const [search, setSearch] = useState<string>("");
  const { data, isLoading, isError, error, refetch } = useAuditLogs(search);

  const rows = data ?? [];

  return (
    <div className="mx-auto w-full max-w-[1300px] animate-fade space-y-6">
      <Seo title="Audit logs · PortBackhaul Admin" description="Immutable platform audit trail." path="/admin/audit-logs" noIndex />

      <PageHeader
        eyebrow="Admin Dashboard"
        title="Audit logs"
        subtitle="Every significant action is recorded. Records cannot be modified or deleted from the application."
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          className="pl-9"
          placeholder="Filter by action, e.g. DRIVER_ACCEPTED"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filter audit log"
        />
      </div>

      <div className="panel overflow-hidden">
        {isError ? (
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="audit records" compact />
        ) : isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading audit trail…</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit records" description="Actions taken on the platform appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <Th>Timestamp</Th>
                  <Th>Action</Th>
                  <Th>Actor role</Th>
                  <Th>Entity</Th>
                  <Th>Reference</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => (
                  <tr key={entry.id} className="data-grid-row">
                    <td className="px-5 py-3.5 font-mono text-xs tabular text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">{entry.action}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{entry.actor_role ?? "system"}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{entry.entity_type ?? "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular text-muted-foreground">
                      {entry.entity_id ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{children}</th>;
}
