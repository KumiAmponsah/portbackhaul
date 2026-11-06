import { AlertTriangle, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { describeError } from "@/lib/errors";

import { AuthPanel } from "./AuthPanel";

type Phase = "verifying" | "ready" | "invalid";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Set-a-new-password screen. Opened from the emailed recovery link
 * (?token_hash=...&type=recovery): the token hash is exchanged for a real
 * Supabase session via verifyOtp, then updateUser({ password }) sets the new
 * password. The recovery session is signed out afterwards so the user signs
 * in fresh with the new password.
 */
export default function ResetPassword() {
  const { updatePassword, verifyEmailToken, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type");

    // Remove the token from the address bar so it never lingers in history.
    if (tokenHash) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    async function run() {
      if (tokenHash && type === "recovery") {
        try {
          await verifyEmailToken(tokenHash, "recovery");
          if (!cancelled) setPhase("ready");
          return;
        } catch (err) {
          if (!cancelled) {
            setVerifyError(
              err instanceof Error
                ? err.message
                : "This reset link is invalid or has expired.",
            );
            setPhase("invalid");
          }
          return;
        }
      }
      // No token in the URL: valid only if a recovery session already exists
      // (e.g. the user refreshed the page after verifying).
      if (!cancelled) setPhase(session ? "ready" : "invalid");
    }

    const timer = window.setTimeout(() => void run(), 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Run once on mount — token verification is single-use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error("Use a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      // Drop the recovery session so the user signs in fresh with the new
      // password — also invalidates the single-use recovery token state.
      await signOut();
      toast.success("Password updated. Sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(describeError(error, "Could not update your password."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPanel>
      <Seo title="Set a new password · PortBackhaul" description="Choose a new password." path="/auth/reset-password" noIndex />

      <Link to="/" className="mb-8 inline-block" aria-label="PortBackhaul home">
        <Logo />
      </Link>

      <span
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-lg ${
          phase === "invalid" ? "bg-status-rejected-bg text-status-rejected" : "bg-status-verified-bg text-status-verified"
        }`}
      >
        {phase === "invalid" ? (
          <AlertTriangle className="h-6 w-6" aria-hidden />
        ) : phase === "verifying" ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        ) : (
          <ShieldCheck className="h-6 w-6" aria-hidden />
        )}
      </span>

      {phase === "verifying" ? (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Verifying your reset link…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One moment while we confirm this link is valid.
          </p>
          <div className="mt-7 flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
            Checking link…
          </div>
        </>
      ) : phase === "invalid" ? (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Link expired or invalid</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {verifyError ?? "Open this page from the reset link in your email so we can verify your identity."}
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link to="/login">Back to sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/forgot-password">Send a new reset link</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Set a new password</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            Link verified. Choose your new password below.
          </p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update password
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          </form>
        </>
      )}
    </AuthPanel>
  );
}
