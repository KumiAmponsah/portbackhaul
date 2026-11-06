import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { QueryErrorState } from "@/components/QueryErrorState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useInitiateMomo, useMomoStatus } from "@/hooks/use-payments";
import { describeError } from "@/lib/errors";
import { formatGhs } from "@/lib/format";

const NETWORKS = [
  { value: "MTN", label: "MTN MoMo" },
  { value: "TELECEL", label: "Telecel Cash" },
  { value: "AIRTEL_TIGO", label: "AirtelTigo Money" },
];

const GH_PHONE_RE = /^(?:0|\+?233)?[235]\d{8}$/;

export interface MomoPaymentTarget {
  paymentId: string;
  amountGhs: number;
  label: string;
}

interface MomoPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: MomoPaymentTarget | null;
  onSettled?: () => void;
}

type Stage = "form" | "processing" | "success" | "failed";

export function MomoPaymentDialog({ open, onOpenChange, target, onSettled }: MomoPaymentDialogProps) {
  const { profile, user } = useAuth();
  const initiate = useInitiateMomo();

  const [stage, setStage] = useState<Stage>("form");
  const [fullName, setFullName] = useState<string>(profile?.full_name ?? "");
  const [phone, setPhone] = useState<string>(profile?.phone ?? "");
  const [network, setNetwork] = useState<string>("MTN");
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [reference, setReference] = useState<string | null>(null);
  const [displayNotice, setDisplayNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestKey = useRef<string>(crypto.randomUUID());

  const inFlight = stage === "processing" && Boolean(reference);
  const { data: statusData, isError: statusError, refetch: refetchStatus } = useMomoStatus(
    reference,
    inFlight,
  );

  useEffect(() => {
    if (open && target) {
      setStage("form");
      setReference(null);
      setDisplayNotice(null);
      setErrorMessage(null);
      setFullName(profile?.full_name ?? "");
      setPhone(profile?.phone ?? "");
      setEmail(user?.email ?? "");
      requestKey.current = crypto.randomUUID();
    }
  }, [open, target, profile?.full_name, profile?.phone, user?.email]);

  useEffect(() => {
    if (!statusData || stage !== "processing") return;
    if (statusData.status === "SUCCESS") {
      setStage("success");
      onSettled?.();
    } else if (["FAILED", "CANCELLED"].includes(statusData.status)) {
      setErrorMessage(statusData.failure_reason ?? "Payment failed.");
      setStage("failed");
      onSettled?.();
    }
  }, [statusData?.status, statusData?.failure_reason]);

  if (!target) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Enter the name on the mobile money wallet.");
      return;
    }
    if (!GH_PHONE_RE.test(phone.trim())) {
      toast.error("Enter a valid Ghana mobile money number (e.g. 024 123 4567).");
      return;
    }
    if (!network) {
      toast.error("Choose your mobile money network.");
      return;
    }

    setErrorMessage(null);

    try {
      const result = await initiate.mutateAsync({
        paymentId: target.paymentId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        momoNetwork: network,
        email: email.trim() || undefined,
        requestKey: requestKey.current,
      });

      setReference(result.reference);
      setDisplayNotice(result.display_text ?? null);

      // If the backend explicitly says it's not configured (rare now)
      if (result.provider_configured === false) {
        setErrorMessage("Paystack is not connected yet — the payment request was recorded and is awaiting provider credentials.");
        setStage("failed");
        return;
      }

      if (result.status === "SUCCESS") {
        setStage("success");
        onSettled?.();
        return;
      }
      
      if (result.status === "FAILED") {
        setErrorMessage(result.failure_reason ?? "The provider rejected the charge.");
        setStage("failed");
        onSettled?.();
        return;
      }
      
      setStage("processing");
    } catch (error) {
      // This catches the 409 RECIPIENT_REQUIRED error!
      setErrorMessage(describeError(error, "Could not start the payment."));
      setStage("failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!inFlight || !next) onOpenChange(next); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" aria-hidden />
            Pay {formatGhs(target.amountGhs)} · Mobile Money
          </DialogTitle>
          <DialogDescription>{target.label}</DialogDescription>
        </DialogHeader>

        {stage === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="momo-name">Wallet holder name</Label>
              <Input
                id="momo-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="momo-phone">Mobile money number</Label>
              <Input
                id="momo-phone"
                type="tel"
                inputMode="tel"
                placeholder="024 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="momo-network">Network</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger id="momo-network" aria-label="Mobile money network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="momo-email">Email (for the receipt)</Label>
              <Input
                id="momo-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={initiate.isPending}>
              {initiate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve {formatGhs(target.amountGhs)} on my phone
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Amount and recipient are confirmed on our servers. You will receive a prompt on your phone to
              authorise the payment with your MoMo PIN.
            </p>
          </form>
        ) : stage === "processing" ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 rounded-lg border border-status-progress/30 bg-status-progress-bg p-4">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-status-progress" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold">Waiting for your approval…</p>
                <p className="mt-0.5 text-muted-foreground">
                  {displayNotice ?? "Check your phone for the mobile money prompt and enter your PIN."}
                </p>
              </div>
            </div>
            <dl className="space-y-1 rounded-lg border border-border p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Transaction reference</dt>
                <dd className="font-mono tabular">{reference}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-mono font-semibold tabular">{formatGhs(target.amountGhs)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={statusData?.status ?? "PROCESSING"} raw />
                </dd>
              </div>
            </dl>
            {statusError ? (
              <QueryErrorState
                error={new Error("Could not reach the payment service.")}
                onRetry={() => void refetchStatus()}
                subject="payment status"
                compact
              />
            ) : null}
            <p className="text-center text-xs text-muted-foreground">
              The status updates automatically. Nothing is marked paid until Paystack confirms the charge.
            </p>
          </div>
        ) : stage === "success" ? (
          <div className="space-y-4 py-2 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-status-verified" aria-hidden />
            <div>
              <p className="text-lg font-bold">Payment confirmed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatGhs(target.amountGhs)} received. The carrier settlement (90%) is queued automatically.
              </p>
            </div>
            <dl className="space-y-1 rounded-lg border border-border p-4 text-left text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="font-mono tabular">{reference}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Amount paid</dt>
                <dd className="font-mono font-semibold tabular">{formatGhs(target.amountGhs)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Payout</dt>
                <dd>
                  <StatusBadge status={statusData?.payout_status ?? "PENDING"} raw />
                </dd>
              </div>
            </dl>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-center">
            <XCircle className="mx-auto h-12 w-12 text-status-danger" aria-hidden />
            <div>
              <p className="text-lg font-bold">Payment not completed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {errorMessage ?? "The charge was not approved or timed out. No money has left your wallet."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => {
                  requestKey.current = crypto.randomUUID();
                  setStage("form");
                  setErrorMessage(null);
                  setReference(null);
                }}
              >
                Try again
              </Button>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}