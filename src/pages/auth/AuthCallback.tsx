import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Landing route for email confirmation and recovery links.
 *
 * Handles:
 *   1. ?token_hash=...&type=signup   -> verifyOtp (recommended template)
 *   2. ?token_hash=...&type=recovery -> verifyOtp
 *   3. ?code=...                     -> PKCE exchange (default template)
 *   4. #access_token=...             -> detectSessionInUrl picks it up
 *
 * Also surfaces Supabase's own error params from query or hash.
 */
export default function AuthCallback() {
  const { verifyEmailToken, refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const errorCode = search.get("error_code") ?? hash.get("error_code");
    const errorDescription =
      search.get("error_description") ?? hash.get("error_description");
    if (errorCode || errorDescription) {
      setError(
        errorDescription?.replace(/\+/g, " ") ??
          "This confirmation link is invalid or has expired. Request a new one and try again.",
      );
      return;
    }

    const tokenHash = search.get("token_hash");
    const type = search.get("type");
    const code = search.get("code");

    // Strip secrets from the address bar so they don't linger in history.
    if (tokenHash || code) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    async function run() {
      try {
        // Path 1: token_hash (our custom template).
        if (tokenHash && (type === "signup" || type === "recovery")) {
          await verifyEmailToken(tokenHash, type);
          if (!cancelled) navigate("/app", { replace: true });
          return;
        }

        // Path 2: PKCE code (Supabase's default template).
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (!cancelled) navigate("/app", { replace: true });
          return;
        }

        // Path 3: implicit flow (detectSessionInUrl) — refresh once.
        await refresh();
        if (!cancelled) navigate("/app", { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not confirm your email. The link may have expired.",
          );
        }
      }
    }

    // Small delay to let detectSessionInUrl finish for the implicit flow.
    const timer = window.setTimeout(() => void run(), 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [verifyEmailToken, refresh, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
      <Seo
        title="Signing you in · PortBackhaul"
        description="Completing sign-in."
        path="/auth/callback"
        noIndex
      />
      {error ? (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-status-rejected-bg text-status-rejected">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-lg font-bold">Link could not be confirmed</h1>
          <p className="max-w-sm text-center text-sm text-muted-foreground">{error}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link to="/login">Back to sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/verify-email">Resend confirmation email</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Confirming your email and signing you in…
          </p>
        </>
      )}
    </div>
  );
}