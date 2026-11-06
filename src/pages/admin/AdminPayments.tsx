import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BanknoteArrowUp,
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  RotateCcw,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";
import { formatDateTime, formatGhs } from "@/lib/format";

/** Admin read over the payment ledger. RLS grants ADMIN_VIEW holders every row. */
function useLedger<T>(key: string, table: string, columns: string, order: string, limit = 500) {
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ["admin-payments", key],
    enabled: hasPermission("ADMIN_VIEW"),
    queryFn: async (): Promise<T[]> => {
      const { data, error } = await supabase
        .from(table as never)
        .select(columns)
        .order(order, { ascending: false })
        .limit(limit);
      if (error) throw new Error(describeError(error));
      return (data ?? []) as T[];
    },
  });
}

interface TransactionRow {
  id: string;
  reference: string;
  provider_reference: string | null;
  amount_pesewas: number;
  currency: string;
  payment_method: string;
  momo_provider: string | null;
  momo_phone: string | null;
  status: string;
  payout_status: string;
  provider_status: string | null;
  gateway_response: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CommissionRow {
  id: string;
  transaction_id: string;
  commission_pesewas: number;
  net_amount_pesewas: number;
}

interface PayoutRow {
  id: string;
  transaction_id: string;
  amount_pesewas: number;
  status: string;
}

interface HistoryRow {
  id: string;
  entity: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  source: string;
  created_at: string;
}

/** Pesewas are the source of truth; convert only at render time. */
function ghs(pesewas: number): string {
  return formatGhs(pesewas / 100);
}

export default function AdminPayments() {
  const transactions = useLedger<TransactionRow>(
    "transactions",
    "payment_transactions",
    "id, reference, provider_reference, amount_pesewas, currency, payment_method, momo_provider, momo_phone, status, payout_status, provider_status, gateway_response, failure_reason, paid_at, created_at, updated_at",
    "created_at",
  );
  const commissions = useLedger<CommissionRow>(
    "commissions",
    "platform_commissions",
    "id, transaction_id, commission_pesewas, net_amount_pesewas",
    "created_at",
  );
  const payouts = useLedger<PayoutRow>(
    "payouts",
    "payout_records",
    "id, transaction_id, amount_pesewas, status",
    "created_at",
  );

  const [selected, setSelected] = useState<TransactionRow | null>(null);

  const stats = useMemo(() => {
    const rows = transactions.data ?? [];
    const sum = (rows2: TransactionRow[], statuses: string[]) =>
      rows2.filter((t) => statuses.includes(t.status)).reduce((total, t) => total + t.amount_pesewas, 0);
    const payoutRows = payouts.data ?? [];
    const payoutSum = (statuses: string[]) =>
      payoutRows.filter((p) => statuses.includes(p.status)).reduce((total, p) => total + p.amount_pesewas, 0);
    const payoutCount = (statuses: string[]) => payoutRows.filter((p) => statuses.includes(p.status)).length;

    return {
      totalTransactions: rows.length,
      successful: rows.filter((t) => t.status === "SUCCESS").length,
      failed: rows.filter((t) => t.status === "FAILED").length,
      pending: rows.filter((t) => ["PENDING", "PROCESSING"].includes(t.status)).length,
      refunded: rows.filter((t) => t.status === "REFUNDED").length,
      volume: sum(rows, ["SUCCESS"]),
      commission: (commissions.data ?? []).reduce((total, c) => total + c.commission_pesewas, 0),
      totalPayouts: payoutRows.length,
      payoutPending: payoutCount(["PENDING", "PROCESSING"]),
      payoutFailed: payoutCount(["FAILED"]),
      payoutValue: payoutSum(["PENDING", "PROCESSING"]),
    };
  }, [transactions.data, commissions.data, payouts.data]);

  const isLoading = transactions.isLoading || commissions.isLoading || payouts.isLoading;
  const isError = transactions.isError || commissions.isError || payouts.isError;
  const error = transactions.error ?? commissions.error ?? payouts.error;

  return (
    <div className="mx-auto w-full max-w-[1400px] animate-fade space-y-6">
      <Seo
        title="Payments · PortBackhaul Admin"
        description="Paystack payment ledger: transactions, commissions and payouts."
        path="/admin/payments"
        noIndex
      />
      <PageHeader
        eyebrow="Admin Dashboard"
        title="Payments"
        subtitle="Mobile Money ledger. Records are written only by secure server-side functions — this view is read-only."
      />

      <section>
        <h2 className="eyebrow mb-3">Transactions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric icon={CreditCard} label="Total transactions" value={stats.totalTransactions} />
          <Metric icon={CheckCircle2} label="Successful" value={stats.successful} tone="verified" />
          <Metric icon={XCircle} label="Failed" value={stats.failed} tone="danger" />
          <Metric icon={Clock} label="Pending" value={stats.pending} tone="pending" />
          <Metric icon={RotateCcw} label="Refunded" value={stats.refunded} />
        </div>
      </section>

      <section>
        <h2 className="eyebrow mb-3">Money</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Metric icon={Receipt} label="Confirmed volume" value={stats.volume} money tone="verified" />
          <Metric icon={BanknoteArrowUp} label="Platform commission (10%)" value={stats.commission} money />
          <Metric icon={Wallet} label="Recipient payouts" value={stats.payoutValue} money tone="pending" />
          <Metric icon={Clock} label="Payouts pending" value={stats.payoutPending} tone="pending" />
          <Metric icon={AlertCircle} label="Payouts failed" value={stats.payoutFailed} tone="danger" />
        </div>
      </section>

      <div className="panel overflow-hidden">
        {isError && transactions.refetch ? (
          <QueryErrorState error={error} onRetry={() => void transactions.refetch()} subject="payments" compact />
        ) : isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading payment ledger…</div>
        ) : (transactions.data ?? []).length === 0 ? (
          <EmptyState icon={CreditCard} title="No transactions yet" description="Transactions appear here once customers pay." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  {["Reference", "Method", "Amount", "Payment", "Payout", "Paid", "Created"].map((column) => (
                    <th
                      key={column}
                      className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(transactions.data ?? []).map((txn) => (
                  <tr
                    key={txn.id}
                    className="data-grid-row cursor-pointer"
                    onClick={() => setSelected(txn)}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold tabular">{txn.reference}</span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {txn.momo_provider ?? txn.payment_method}
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold tabular">{ghs(txn.amount_pesewas)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={txn.status} raw />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={txn.payout_status} raw />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground tabular">{txn.paid_at ? formatDateTime(txn.paid_at) : "—"}</td>
                    <td className="px-5 py-4 text-muted-foreground tabular">{formatDateTime(txn.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionInspector txn={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  money,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  money?: boolean;
  tone?: "pending" | "verified" | "danger";
}) {
  const toneClass =
    tone === "pending"
      ? "text-status-pending"
      : tone === "verified"
        ? "text-status-verified"
        : tone === "danger"
          ? "text-status-danger"
          : "text-foreground";

  return (
    <div className="panel p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-extrabold tabular ${toneClass}`}>
        {money ? ghs(value) : value.toLocaleString("en-GH")}
      </p>
    </div>
  );
}

function TransactionInspector({ txn, onClose }: { txn: TransactionRow | null; onClose: () => void }) {
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["admin-payments", "history", txn?.id],
    enabled: txn !== null,
    queryFn: async (): Promise<HistoryRow[]> => {
      const { data, error } = await supabase
        .from("payment_status_history")
        .select("id, entity, old_status, new_status, note, source, created_at")
        .eq("transaction_id", txn?.id ?? "")
        .order("created_at", { ascending: true });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as HistoryRow[];
    },
  });

  return (
    <Sheet open={txn !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {txn ? (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono text-base">{txn.reference}</SheetTitle>
              <SheetDescription>
                {txn.momo_provider ?? txn.payment_method} · {ghs(txn.amount_pesewas)} {txn.currency}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <section>
                <h3 className="eyebrow mb-3">Transaction</h3>
                <dl className="space-y-2.5 text-sm">
                  <Row label="Payment status" value={<StatusBadge status={txn.status} raw />} />
                  <Row label="Payout status" value={<StatusBadge status={txn.payout_status} raw />} />
                  <Row label="Provider status" value={txn.provider_status ?? "—"} />
                  <Row label="Gateway response" value={txn.gateway_response ?? "—"} />
                  <Row label="Mobile Money" value={`${txn.momo_provider ?? "—"} · ${txn.momo_phone ?? "—"}`} />
                  <Row label="Paystack reference" value={<span className="font-mono text-xs">{txn.provider_reference ?? "—"}</span>} />
                  <Row label="Paid at" value={<span className="tabular">{txn.paid_at ? formatDateTime(txn.paid_at) : "—"}</span>} />
                  <Row label="Created" value={<span className="tabular">{formatDateTime(txn.created_at)}</span>} />
                  <Row label="Updated" value={<span className="tabular">{formatDateTime(txn.updated_at)}</span>} />
                </dl>

                {txn.failure_reason ? (
                  <div className="mt-4 rounded-md border border-status-danger/30 bg-status-danger-bg p-3">
                    <p className="eyebrow mb-1 text-status-danger">Failure reason</p>
                    <p className="text-sm text-status-danger">{txn.failure_reason}</p>
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="eyebrow mb-3">Status history</h3>
                {historyLoading ? (
                  <p className="text-sm text-muted-foreground">Loading history…</p>
                ) : (history ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No status changes recorded.</p>
                ) : (
                  <ol className="space-y-3">
                    {(history ?? []).map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3 text-sm">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-border" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {entry.old_status ? `${entry.old_status} → ` : ""}
                            {entry.new_status}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">{entry.entity}</span>
                          </p>
                          {entry.note ? <p className="text-muted-foreground">{entry.note}</p> : null}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground tabular">
                          {formatDateTime(entry.created_at)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                Transaction states are changed exclusively by the payments edge function (verification or webhook).
                There is no manual override — this protects the audit trail.
              </p>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
