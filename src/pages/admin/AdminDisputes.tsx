import { ClipboardList, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PageHeader } from "@/components/PageHeader";
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
import { useResolveDispute } from "@/hooks/use-admin";
import { useDisputes, type Dispute } from "@/hooks/use-payments";
import { describeError } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

export default function AdminDisputes() {
  const { data, isLoading, isError, error, refetch } = useDisputes();
  const resolve = useResolveDispute();

  const [active, setActive] = useState<Dispute | null>(null);
  const [status, setStatus] = useState<string>("RESOLVED");
  const [notes, setNotes] = useState<string>("");

  async function handleResolve() {
    if (!active) return;
    if (!notes.trim()) {
      toast.error("Add resolution notes before closing this dispute.");
      return;
    }
    try {
      await resolve.mutateAsync({ disputeId: active.id, status, notes: notes.trim() });
      toast.success("Dispute updated");
      setActive(null);
      setNotes("");
    } catch (error) {
      toast.error(describeError(error));
    }
  }

  const rows = data ?? [];

  return (
    <div className="mx-auto w-full max-w-[1200px] animate-fade space-y-6">
      <Seo
        title="Disputes · PortBackhaul Admin"
        description="Review and resolve disputes."
        path="/admin/disputes"
        noIndex
      />

      <PageHeader
        eyebrow="Admin Dashboard"
        title="Disputes"
        subtitle="Issues raised by clearing agents and drivers."
      />

      {isError ? (
        <div className="panel">
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="disputes" compact />
        </div>
      ) : isLoading ? (
        <div className="panel p-6 text-sm text-muted-foreground">Loading disputes…</div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={ClipboardList}
            title="No disputes"
            description="Reported issues will appear here for review."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((dispute) => (
            <article key={dispute.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                      {dispute.category.replace(/_/g, " ")}
                    </span>
                    <StatusBadge status={dispute.status} raw />
                  </div>
                  <p className="mt-3 text-sm">{dispute.description}</p>
                  {dispute.resolution_notes ? (
                    <p className="mt-2 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Resolution: </span>
                      {dispute.resolution_notes}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground tabular">
                    {formatDateTime(dispute.created_at)}
                  </p>
                </div>

                {!["RESOLVED", "REJECTED"].includes(dispute.status) ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActive(dispute);
                      setStatus("RESOLVED");
                      setNotes("");
                    }}
                  >
                    Review
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve dispute</DialogTitle>
            <DialogDescription>Your decision and notes are written to the audit log.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Resolution status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ESCALATED">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resolution notes"
              aria-label="Resolution notes"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleResolve()} disabled={resolve.isPending}>
              {resolve.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}