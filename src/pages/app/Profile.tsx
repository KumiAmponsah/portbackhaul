import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Seo } from "@/components/Seo";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useVerificationRequirements } from "@/hooks/use-platform-data";
import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";

interface VerificationDocument {
  id: string;
  document_type: string;
  document_number: string | null;
  storage_path: string;
  document_status: string;
  expiry_date: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { profile, user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const { data: requirements } = useVerificationRequirements(profile?.role);

  const [fullName, setFullName] = useState<string>(profile?.full_name ?? "");
  const [phone, setPhone] = useState<string>(profile?.phone ?? "");
  const [companyName, setCompanyName] = useState<string>(profile?.company_name ?? "");
  const [notes, setNotes] = useState<string>("");

  const documentsQuery = useQuery({
    queryKey: ["verification-documents", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<VerificationDocument[]> => {
      const { data, error } = await supabase
        .from("user_verification_documents")
        .select("id, document_type, document_number, storage_path, document_status, expiry_date, rejection_reason, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(describeError(error));
      return (data ?? []) as VerificationDocument[];
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, company_name: companyName })
        .eq("id", user!.id);
      if (error) throw new Error(describeError(error));
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const submitVerification = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("submit_verification", { p_notes: notes || undefined });
      if (error) throw new Error(describeError(error));
    },
    onSuccess: async () => {
      toast.success("Verification submitted for review");
      setNotes("");
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["verification-documents"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const deleteDocument = useMutation({
    mutationFn: async (doc: VerificationDocument) => {
      await supabase.storage.from("verification-documents").remove([doc.storage_path]);
      const { error } = await supabase.from("user_verification_documents").delete().eq("id", doc.id);
      if (error) throw new Error(describeError(error));
    },
    onSuccess: () => {
      toast.success("Document removed");
      void queryClient.invalidateQueries({ queryKey: ["verification-documents"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  if (!profile) return null;

  const documents = documentsQuery.data ?? [];
  const canSubmit = documents.length > 0 && ["NOT_SUBMITTED", "REJECTED", "MORE_INFO_REQUESTED"].includes(profile.verification_status);

  return (
    <div className="mx-auto w-full max-w-[1000px] animate-fade space-y-7">
      <Seo title="Profile & verification · PortBackhaul" description="Manage your profile and verification documents." path="/app/profile" noIndex />

      <PageHeader
        eyebrow="Account"
        title="Profile & verification"
        subtitle={`Registered as ${ROLE_LABEL[profile.role]}`}
        meta={
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={profile.account_status} raw />
            <StatusBadge status={profile.verification_status} raw />
          </div>
        }
      />

      <section className="panel p-6">
        <h2 className="text-base font-bold">Your details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-phone">Phone</Label>
            <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-company">Company</Label>
            <Input id="p-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" value={profile.email ?? ""} disabled />
          </div>
        </div>
        <Button className="mt-5" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
          {saveProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Account status, role and verification decisions can only be changed by an authorised administrator.
        </p>
      </section>

      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold">Verification documents</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Uploaded to a private bucket. Only you and authorised reviewers can open them.
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        </div>

        <div className="mt-6 space-y-3">
          {(requirements ?? []).map((requirement) => {
            const existing = documents.find((d) => d.document_type === requirement.document_type);
            return (
              <DocumentRow
                key={requirement.id}
                label={requirement.label}
                documentType={requirement.document_type}
                required={requirement.is_required}
                requiresNumber={requirement.requires_number}
                requiresExpiry={requirement.requires_expiry}
                existing={existing}
                userId={user!.id}
                onChanged={() => void queryClient.invalidateQueries({ queryKey: ["verification-documents"] })}
                onDelete={(doc) => deleteDocument.mutate(doc)}
              />
            );
          })}
        </div>

        {canSubmit ? (
          <div className="mt-6 border-t border-border pt-6">
            <Label htmlFor="v-notes">Notes for the reviewer (optional)</Label>
            <Textarea
              id="v-notes"
              className="mt-1.5"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the reviewer should know about your submission."
            />
            <Button className="mt-4" onClick={() => submitVerification.mutate()} disabled={submitVerification.isPending}>
              {submitVerification.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit for verification
            </Button>
          </div>
        ) : profile.verification_status === "SUBMITTED" || profile.verification_status === "UNDER_REVIEW" ? (
          <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-status-pending/30 bg-status-pending-bg p-4 text-sm text-status-pending">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Your submission is with our review team.
          </div>
        ) : profile.verification_status === "VERIFIED" ? (
          <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-status-verified/30 bg-status-verified-bg p-4 text-sm text-status-verified">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Your account is verified.
          </div>
        ) : null}
      </section>
    </div>
  );
}

interface DocumentRowProps {
  label: string;
  documentType: string;
  required: boolean;
  requiresNumber: boolean;
  requiresExpiry: boolean;
  existing: VerificationDocument | undefined;
  userId: string;
  onChanged: () => void;
  onDelete: (doc: VerificationDocument) => void;
}

function DocumentRow({
  label,
  documentType,
  required,
  requiresNumber,
  requiresExpiry,
  existing,
  userId,
  onChanged,
  onDelete,
}: DocumentRowProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [documentNumber, setDocumentNumber] = useState<string>("");
  const [expiry, setExpiry] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${userId}/verification/${documentType.toLowerCase()}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(path, file, { upsert: false });
      if (uploadError) throw new Error(describeError(uploadError));

      const { error } = await supabase.from("user_verification_documents").insert({
        user_id: userId,
        document_type: documentType,
        document_number: documentNumber || null,
        storage_path: path,
        expiry_date: expiry || null,
        document_status: "SUBMITTED",
      });
      if (error) throw new Error(describeError(error));

      toast.success(`${label} uploaded`);
      onChanged();
    } catch (error) {
      toast.error(describeError(error, "Upload failed."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {label}
            {required ? <span className="ml-1.5 text-destructive">*</span> : null}
          </p>
          {existing ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Uploaded {formatDate(existing.created_at)}
              {existing.document_number ? ` · ${existing.document_number}` : ""}
              {existing.expiry_date ? ` · expires ${formatDate(existing.expiry_date)}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">PDF or image, up to 10 MB.</p>
          )}
          {existing?.rejection_reason ? (
            <p className="mt-1.5 text-xs text-destructive">Reviewer note: {existing.rejection_reason}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {existing ? <StatusBadge status={existing.document_status} raw /> : null}
          {existing && existing.document_status === "SUBMITTED" ? (
            <Button variant="ghost" size="sm" onClick={() => onDelete(existing)} aria-label={`Remove ${label}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {!existing ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          {requiresNumber ? (
            <div className="w-40 space-y-1">
              <Label htmlFor={`num-${documentType}`} className="text-xs">
                Document number
              </Label>
              <Input
                id={`num-${documentType}`}
                className="h-9"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>
          ) : null}
          {requiresExpiry ? (
            <div className="w-40 space-y-1">
              <Label htmlFor={`exp-${documentType}`} className="text-xs">
                Expiry date
              </Label>
              <Input
                id={`exp-${documentType}`}
                type="date"
                className="h-9"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>
          ) : null}

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </div>
      ) : null}
    </div>
  );
}
