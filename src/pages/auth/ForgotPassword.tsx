import { KeyRound, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { describeError } from "@/lib/errors";

import { AuthPanel } from "./AuthPanel";

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
      toast.success("Password reset email sent");
    } catch (error) {
      toast.error(describeError(error, "Could not send the reset email."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPanel>
      <Seo title="Reset your password · PortBackhaul" description="Request a password reset link." path="/forgot-password" noIndex />

      <Link to="/" className="mb-8 inline-block" aria-label="PortBackhaul home">
        <Logo />
      </Link>

      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <KeyRound className="h-6 w-6" aria-hidden />
      </span>

      <h1 className="text-2xl font-extrabold tracking-tight">Forgot your password?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email address and we'll send you a secure link to set a new password.
      </p>

      {sent ? (
        <div className="mt-7 rounded-lg border border-status-verified/30 bg-status-verified-bg p-4">
          <p className="text-sm font-medium text-status-verified">
            If an account exists for {email}, a reset link is on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Email address</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthPanel>
  );
}
