import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { describeError } from "@/lib/errors";
import { ROLE_BLURB, ROLE_LABEL, SIGNUP_ROLES, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

import { AuthPanel } from "./AuthPanel";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>("CLEARING_AGENT");
  const [fullName, setFullName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        role,
      });
      toast.success("Verification email sent");
      navigate("/verify-email", {
        replace: true,
        state: { email: email.trim() },
      });
    } catch (error) {
      toast.error(describeError(error, "Could not create your account."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPanel>
      <Seo
        title="Create an account · PortBackhaul"
        description="Register as a clearing agent or driver on PortBackhaul."
        path="/register"
        noIndex
      />

      <Link to="/" className="mb-8 inline-block" aria-label="PortBackhaul home">
        <Logo />
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every new account is reviewed and verified by our team before marketplace features are enabled.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-5">
        <fieldset>
          <legend className="eyebrow mb-3">I am a</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SIGNUP_ROLES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                aria-pressed={role === option}
                className={cn(
                  "rounded-lg border p-3 text-left transition-all",
                  role === option
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span className="block text-sm font-semibold">{ROLE_LABEL[option]}</span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {ROLE_BLURB[option]}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+233 24 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {role === "CLEARING_AGENT" ? (
          <div className="space-y-1.5">
            <Label htmlFor="company">
              Company name{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link to="/terms" className="underline">
            terms of service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline">
            privacy policy
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthPanel>
  );
}