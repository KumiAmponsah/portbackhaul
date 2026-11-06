import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";
import type { AccountStatus, Role, VerificationStatus } from "@/lib/roles";

export interface AdminOverview {
  pending_users: number;
  approved_users: number;
  blocked_users: number;
  total_users: number;
  shipments: number;
  active_trips: number;
  completed_trips: number;
  trucks: number;
  drivers: number;
  open_disputes: number;
  payments_held: number;
  payments_released: number;
}

export function useAdminOverview() {
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ["admin-overview"],
    enabled: hasPermission("ADMIN_VIEW"),
    queryFn: async (): Promise<AdminOverview> => {
      const { data, error } = await supabase.rpc("admin_overview");
      if (error) throw new Error(describeError(error));
      return data as unknown as AdminOverview;
    },
  });
}

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  role: Role;
  account_status: AccountStatus;
  verification_status: VerificationStatus;
  created_at: string;
  rejection_reason: string | null;
  suspension_reason: string | null;
  block_reason: string | null;
  document_count: number;
}

export function useAdminUsers(filters: { status?: string | null; role?: string | null; search?: string }) {
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ["admin-users", filters.status, filters.role, filters.search],
    enabled: hasPermission("USER_VIEW"),
    queryFn: async (): Promise<AdminUser[]> => {
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
        p_role: filters.role && filters.role !== "ALL" ? filters.role : undefined,
        p_search: filters.search || undefined,
        p_limit: 100,
      });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as AdminUser[];
    },
  });
}

export type AdminAction = "APPROVE" | "REJECT" | "SUSPEND" | "BLOCK" | "UNBLOCK" | "REQUEST_MORE_INFO";

/**
 * All account-status changes go through the admin-actions edge function, which
 * verifies the admin's permission with the service role and revokes sessions on
 * BLOCK. The client never writes account_status directly.
 */
export function useAdminAccountAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, action, reason }: { userId: string; action: AdminAction; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: { action: "set_account_status", user_id: userId, decision: action, reason: reason ?? null },
      });
      if (error) {
        const context = (error as { context?: { body?: string } }).context;
        throw new Error(describeError(context?.body ?? error.message, "The action could not be completed."));
      }
      if ((data as { error?: string })?.error) throw new Error(describeError((data as { error: string }).error));
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] });
    },
  });
}

export interface AdminDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_number: string | null;
  storage_path: string;
  document_status: string;
  expiry_date: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export function useAdminUserDocuments(userId: string | undefined) {
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ["admin-user-detail", userId],
    enabled: Boolean(userId) && hasPermission("DOCUMENT_REVIEW"),
    queryFn: async (): Promise<AdminDocument[]> => {
      const { data, error } = await supabase
        .from("user_verification_documents")
        .select("id, user_id, document_type, document_number, storage_path, document_status, expiry_date, rejection_reason, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as AdminDocument[];
    },
  });
}

export function useReviewDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, status, reason }: { documentId: string; status: string; reason?: string }) => {
      const { error } = await supabase.rpc("admin_review_document", {
        p_document_id: documentId,
        p_status: status,
        p_reason: reason ?? undefined,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-user-detail"] }),
  });
}

/** Creates a short-lived signed URL for a private document. */
export async function signDocumentUrl(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 120);
  if (error) {
    console.error("Could not sign document URL", error.message);
    return null;
  }
  return data.signedUrl;
}

export interface StatusHistoryEntry {
  id: string;
  previous_status: string | null;
  new_status: string;
  reason: string | null;
  created_at: string;
}

export function useUserStatusHistory(userId: string | undefined) {
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ["user-status-history", userId],
    enabled: Boolean(userId) && hasPermission("USER_VIEW"),
    queryFn: async (): Promise<StatusHistoryEntry[]> => {
      const { data, error } = await supabase
        .from("user_status_history")
        .select("id, previous_status, new_status, reason, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as StatusHistoryEntry[];
    },
  });
}

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useAuditLogs(search: string) {
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ["audit-logs", search],
    enabled: hasPermission("ADMIN_VIEW"),
    queryFn: async (): Promise<AuditEntry[]> => {
      let query = supabase
        .from("audit_logs")
        .select("id, actor_id, actor_role, action, entity_type, entity_id, metadata, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (search.trim()) query = query.ilike("action", `%${search.trim()}%`);

      const { data, error } = await query;
      if (error) throw new Error(describeError(error));
      return (data ?? []) as AuditEntry[];
    },
  });
}

export function useUpdatePlatformSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase.rpc("admin_update_setting", { p_key: key, p_value: value as never });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-setting"] });
      void queryClient.invalidateQueries({ queryKey: ["platform-settings-all"] });
    },
  });
}

export function useAllPlatformSettings() {
  const { hasPermission } = useAuth();

  return useQuery({
    queryKey: ["platform-settings-all"],
    enabled: hasPermission("ADMIN_VIEW"),
    queryFn: async (): Promise<{ key: string; value: unknown; description: string | null }[]> => {
      const { data, error } = await supabase.from("platform_settings").select("key, value, description").order("key");
      if (error) throw new Error(describeError(error));
      return data ?? [];
    },
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ disputeId, status, notes }: { disputeId: string; status: string; notes: string }) => {
      const { error } = await supabase.rpc("admin_resolve_dispute", {
        p_dispute_id: disputeId,
        p_status: status,
        p_notes: notes,
      });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["disputes"] }),
  });
}
