import { Eye, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  signDocumentUrl,
  useAdminUserDocuments,
  useReviewDocument,
  useUserStatusHistory,
  type AdminAction,
  type AdminUser,
} from "@/hooks/use-admin";
import { describeError } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";

interface UserReviewDrawerProps {
  user: AdminUser | null;
  onClose: () => void;
  onAction: (action: AdminAction) => void;
}

export function UserReviewDrawer({ user, onClose, onAction }: UserReviewDrawerProps) {
  const { data: documents, isLoading } = useAdminUserDocuments(user?.id);
  const { data: history } = useUserStatusHistory(user?.id);
  const review = useReviewDocument();
  const [opening, setOpening] = useState<string | null>(null);

  async function openDocument(path: string, id: string) {
    setOpening(id);
    try {
      // Private bucket: a short-lived signed URL is minted per view.
      const url = await signDocumentUrl("verification-documents", path);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("This document could not be opened. It may not have been uploaded yet.");
      }
    } finally {
      setOpening(null);
    }
  }

  return (
    <Sheet open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {user ? (
          <>
            <SheetHeader>
              <SheetTitle>{user.full_name ?? "Unnamed account"}</SheetTitle>
              <SheetDescription>
                {user.email} · {ROLE_LABEL[user.role]}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <section>
                <h3 className="eyebrow mb-3">Account</h3>
                <dl className="space-y-2.5 text-sm">
                  <Row label="Account status" value={<StatusBadge status={user.account_status} raw />} />
                  <Row label="Verification" value={<StatusBadge status={user.verification_status} raw />} />
                  <Row label="Phone" value={<span className="font-mono tabular">{user.phone ?? "—"}</span>} />
                  <Row label="Company" value={<span>{user.company_name ?? "—"}</span>} />
                  <Row label="Registered" value={<span className="tabular">{formatDate(user.created_at)}</span>} />
                </dl>

                {user.rejection_reason || user.suspension_reason || user.block_reason ? (
                  <div className="mt-4 rounded-md border border-status-danger/30 bg-status-danger-bg p-3">
                    <p className="eyebrow mb-1 text-status-danger">Latest reason</p>
                    <p className="text-sm text-status-danger">
                      {user.block_reason ?? user.suspension_reason ?? user.rejection_reason}
                    </p>
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="eyebrow mb-3">Submitted documents</h3>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading documents…</p>
                ) : (documents ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">This user has not uploaded any documents yet.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {(documents ?? []).map((doc) => (
                      <li key={doc.id} className="rounded-lg border border-border p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-semibold">
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                              {doc.document_type.replace(/_/g, " ")}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {doc.document_number ? `${doc.document_number} · ` : ""}
                              submitted {formatDate(doc.created_at)}
                              {doc.expiry_date ? ` · expires ${formatDate(doc.expiry_date)}` : ""}
                            </p>
                          </div>
                          <StatusBadge status={doc.document_status} raw />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void openDocument(doc.storage_path, doc.id)}
                            disabled={opening === doc.id}
                          >
                            {opening === doc.id ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Eye className="mr-2 h-3.5 w-3.5" />
                            )}
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              review.mutate(
                                { documentId: doc.id, status: "ACCEPTED" },
                                {
                                  onSuccess: () => toast.success("Document accepted"),
                                  onError: (error) => toast.error(describeError(error)),
                                },
                              )
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              review.mutate(
                                { documentId: doc.id, status: "REJECTED", reason: "Document not legible or invalid" },
                                {
                                  onSuccess: () => toast.success("Document rejected"),
                                  onError: (error) => toast.error(describeError(error)),
                                },
                              )
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="eyebrow mb-3">Review history</h3>
                {(history ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No status changes recorded.</p>
                ) : (
                  <ol className="space-y-3">
                    {(history ?? []).map((entry) => (
                      <li key={entry.id} className="flex items-start gap-3 text-sm">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-border" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">
                            {entry.previous_status ? `${entry.previous_status} → ` : ""}
                            {entry.new_status}
                          </p>
                          {entry.reason ? <p className="text-muted-foreground">{entry.reason}</p> : null}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground tabular">
                          {formatDateTime(entry.created_at)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="border-t border-border pt-5">
                <h3 className="eyebrow mb-3">Decision</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => onAction("APPROVE")}>Approve</Button>
                  <Button variant="outline" onClick={() => onAction("REQUEST_MORE_INFO")}>
                    Request more info
                  </Button>
                  <Button variant="outline" onClick={() => onAction("SUSPEND")}>
                    Suspend
                  </Button>
                  <Button variant="destructive" onClick={() => onAction("REJECT")}>
                    Reject
                  </Button>
                  <Button variant="destructive" className="col-span-2" onClick={() => onAction("BLOCK")}>
                    Block account
                  </Button>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
