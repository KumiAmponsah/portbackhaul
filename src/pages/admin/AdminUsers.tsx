import { CalendarDays, FileText, Loader2, MoreVertical, Search, Users } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAccountAction, useAdminUsers, type AdminAction, type AdminUser } from "@/hooks/use-admin";
import { useAuth } from "@/hooks/use-auth";
import { describeError } from "@/lib/errors";
import { formatDate, initials } from "@/lib/format";
import { ROLE_LABEL, ROLES, type AdminPermission } from "@/lib/roles";
import { cn } from "@/lib/utils";

import { UserReviewDrawer } from "./UserReviewDrawer";

const TABS = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "SUSPENDED", label: "Suspended" },
  { key: "BLOCKED", label: "Blocked" },
] as const;

/** Actions that require a written reason before they can be submitted. */
const REASON_REQUIRED: AdminAction[] = ["REJECT", "SUSPEND", "BLOCK", "REQUEST_MORE_INFO"];

const ACTION_PERMISSION: Record<AdminAction, AdminPermission> = {
  APPROVE: "USER_APPROVE",
  REJECT: "USER_REJECT",
  SUSPEND: "USER_SUSPEND",
  BLOCK: "USER_BLOCK",
  UNBLOCK: "USER_UNBLOCK",
  REQUEST_MORE_INFO: "DOCUMENT_REVIEW",
};

const ACTION_TITLE: Record<AdminAction, string> = {
  APPROVE: "Approve user",
  REJECT: "Reject user",
  SUSPEND: "Suspend user",
  BLOCK: "Block user",
  UNBLOCK: "Unblock user",
  REQUEST_MORE_INFO: "Request more information",
};

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = useAuth();

  const status = searchParams.get("status") ?? "PENDING";
  const [role, setRole] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [reviewUser, setReviewUser] = useState<AdminUser | null>(null);

  const [pendingAction, setPendingAction] = useState<{ user: AdminUser; action: AdminAction } | null>(null);
  const [reason, setReason] = useState<string>("");

  const { data: users, isLoading, isError, error, refetch } = useAdminUsers({ status, role, search });
  const accountAction = useAdminAccountAction();

  function openAction(user: AdminUser, action: AdminAction) {
    if (!hasPermission(ACTION_PERMISSION[action])) {
      toast.error("You do not have the administrative permission required for this action.");
      return;
    }
    setPendingAction({ user, action });
    setReason("");
  }

  async function submitAction() {
    if (!pendingAction) return;
    const { user, action } = pendingAction;

    if (REASON_REQUIRED.includes(action) && !reason.trim()) {
      toast.error("A reason is required for this action.");
      return;
    }

    try {
      await accountAction.mutateAsync({ userId: user.id, action, reason: reason.trim() || undefined });
      toast.success(`${user.full_name ?? "User"} · ${ACTION_TITLE[action].toLowerCase()} complete`);
      setPendingAction(null);
      setReason("");
    } catch (error) {
      toast.error(describeError(error));
    }
  }

  const rows = users ?? [];

  return (
    <div className="mx-auto w-full max-w-[1400px] animate-fade space-y-6">
      <Seo title="Approvals & verification · PortBackhaul" description="Review and verify user accounts." path="/admin/users" noIndex />

      <PageHeader
        eyebrow="Admin Dashboard"
        title="Approvals & Verification"
        subtitle="Review and verify user accounts to keep the platform trusted and compliant."
      />

      <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={status === tab.key}
            onClick={() => setSearchParams({ status: tab.key })}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              status === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {status === tab.key ? ` (${rows.length})` : ""}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)_240px]">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger aria-label="Filter by role">
            <SelectValue placeholder="Role: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Role: All</SelectItem>
            {ROLES.filter((r) => r !== "ADMIN").map((item) => (
              <SelectItem key={item} value={item}>
                {ROLE_LABEL[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
          />
        </div>

        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          Registered: all time
        </div>
      </div>

      <div className="panel overflow-hidden">
        {isError ? (
          <QueryErrorState error={error} onRetry={() => void refetch()} subject="accounts" compact />
        ) : isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading accounts…</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No accounts in this state"
            description="Accounts appear here as users register and submit their verification documents."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Registered</Th>
                  <Th>Documents</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id} className="data-grid-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
                          {initials(user.full_name ?? user.email)}
                        </span>
                        <span className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setReviewUser(user)}
                            className="block truncate font-semibold hover:text-primary hover:underline"
                          >
                            {user.full_name ?? "Unnamed account"}
                          </button>
                          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{ROLE_LABEL[user.role]}</td>
                    <td className="px-5 py-4 text-muted-foreground tabular">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setReviewUser(user)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        {user.document_count} submitted
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={user.account_status} raw />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.account_status !== "APPROVED" ? (
                          <Button size="sm" onClick={() => openAction(user, "APPROVE")}>
                            Approve
                          </Button>
                        ) : null}
                        {["PENDING", "APPROVED"].includes(user.account_status) ? (
                          <Button size="sm" variant="outline" onClick={() => openAction(user, "REJECT")}>
                            Reject
                          </Button>
                        ) : null}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label={`More actions for ${user.full_name ?? user.email}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setReviewUser(user)}>Review documents</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openAction(user, "REQUEST_MORE_INFO")}>
                              Request more info
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openAction(user, "SUSPEND")}>Suspend</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openAction(user, "BLOCK")}>Block</DropdownMenuItem>
                            {user.account_status === "BLOCKED" ? (
                              <DropdownMenuItem onSelect={() => openAction(user, "UNBLOCK")}>Unblock</DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-border px-5 py-3.5">
          <p className="text-sm text-muted-foreground">
            Showing {rows.length} {status.toLowerCase()} account{rows.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* reason-required action modal */}
      <Dialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingAction ? ACTION_TITLE[pendingAction.action] : ""}</DialogTitle>
            <DialogDescription>
              {pendingAction && REASON_REQUIRED.includes(pendingAction.action)
                ? "Please provide a reason for this decision. This will be shared with the user."
                : "This decision is recorded in the account's immutable status history."}
            </DialogDescription>
          </DialogHeader>

          {pendingAction ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/50 p-3">
                <p className="text-sm font-semibold">{pendingAction.user.full_name ?? "Unnamed account"}</p>
                <p className="text-xs text-muted-foreground">
                  {pendingAction.user.email} · {ROLE_LABEL[pendingAction.user.role]}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason">
                  Reason {REASON_REQUIRED.includes(pendingAction.action) ? <span className="text-destructive">*</span> : "(optional)"}
                </Label>
                <Textarea
                  id="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void submitAction()}
              disabled={accountAction.isPending}
              variant={pendingAction && ["REJECT", "BLOCK"].includes(pendingAction.action) ? "destructive" : "default"}
            >
              {accountAction.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {pendingAction ? ACTION_TITLE[pendingAction.action] : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserReviewDrawer
        user={reviewUser}
        onClose={() => setReviewUser(null)}
        onAction={(action) => {
          if (reviewUser) openAction(reviewUser, action);
        }}
      />
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground", className)}>
      {children}
    </th>
  );
}
