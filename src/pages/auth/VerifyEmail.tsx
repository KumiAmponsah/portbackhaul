import { Loader2, MailCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { describeError } from "@/lib/errors";

import { AuthPanel } from "./AuthPanel";

export default function VerifyEmail() {
  const { user, isEmailVerified, resendVerification, refresh, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const stateEmail = (location.state as { email?: string } | null)?.email;
  const [email, setEmail] = useState<string>(stateEmail ?? user?.email ?? "");
  const [resending, setResending] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);

  if (user && isEmailVerified) return <Navigate to="/app" replace />;

  async function handleResend() {
    if (!email.trim()) {
      toast.error("Enter the email address you registered with.");
      return;
    }
    setResending(true);
    try {
      await resendVerification(email.trim());
      toast.success("Verification email sent. Please check your inbox.");
    } catch (error) {
      toast.error(describeError(error, "Could not resend the verification email."));
    } finally {
      setResending(false);
    }
  }

  async function handleCheck() {
    setChecking(true);
    try {
      await refresh();
      const { data } = await import("@/integrations/supabase/client").then((m) => m.supabase.auth.getUser());
      if (data.user?.email_confirmed_at) {
        toast.success("Email verified");
        navigate("/app", { replace: true });
      } else {
        toast.error("We can't see a verification yet. Click the link in the email, then try again.");
      }
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setChecking(false);
    }
  }

  return (
    <AuthPanel>
      <Seo title="Verify your email · PortBackhaul" description="Confirm your email address." path="/verify-email" noIndex />

      <Link to="/" className="mb-8 inline-block" aria-label="PortBackhaul home">
        <Logo />
      </Link>

      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-status-verified-bg text-status-verified">
        <MailCheck className="h-6 w-6" aria-hidden />
      </span>

      <h1 className="text-2xl font-extrabold tracking-tight">Verification email sent</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Please check your inbox and verify your email before continuing. The link opens PortBackhaul and signs you
        in automatically.
      </p>

      <div className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="verify-email">Email address</Label>
          <Input
            id="verify-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => void handleCheck()} disabled={checking} className="flex-1">
            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            I've verified my email
          </Button>
          <Button variant="outline" onClick={() => void handleResend()} disabled={resending} className="flex-1">
            {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Resend email
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void signOut().then(() => navigate("/login"))}
        className="mt-8 text-sm text-muted-foreground underline hover:text-foreground"
      >
        Use a different account
      </button>
    </AuthPanel>
  );
}
