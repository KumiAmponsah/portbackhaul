import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import { describeError } from "@/lib/errors";
import type {
  AccountStatus,
  AdminPermission,
  Role,
  VerificationStatus,
} from "@/lib/roles";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  role: Role;
  account_status: AccountStatus;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  suspension_reason: string | null;
  block_reason: string | null;
  created_at: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  permissions: AdminPermission[];
  isLoading: boolean;
  isEmailVerified: boolean;
  isApproved: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  verifyEmailToken: (
    tokenHash: string,
    type: "signup" | "recovery",
  ) => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (permission: AdminPermission) => boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  companyName?: string;
  role: Role;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Where Supabase should send users after they click the email link. */
function callbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

function resetUrl(): string {
  return `${window.location.origin}/auth/reset-password`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialising, setInitialising] = useState<boolean>(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setInitialising(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setInitialising(false);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["admin-permissions"] });
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    staleTime: 30_000,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) {
        console.error("Failed to load profile", error.message);
        throw new Error(describeError(error));
      }
      return (data as Profile | null) ?? null;
    },
  });

  const permissionsQuery = useQuery({
    queryKey: ["admin-permissions", userId],
    enabled: Boolean(userId) && profileQuery.data?.role === "ADMIN",
    staleTime: 60_000,
    queryFn: async (): Promise<AdminPermission[]> => {
      const { data, error } = await supabase
        .from("admin_permissions")
        .select("permission")
        .eq("admin_user_id", userId!);
      if (error) {
        console.error("Failed to load admin permissions", error.message);
        return [];
      }
      return (data ?? []).map((row) => row.permission as AdminPermission);
    },
  });

  /**
   * Creates the user via Supabase Auth and sends the confirmation email
   * through the project's configured SMTP (GoTrue handles it).
   *
   * The signup metadata (full_name, phone, company_name, role) is stored in
   * `auth.users.raw_user_meta_data` and picked up by your on-signup trigger
   * when it inserts the `profiles` row.
   */
  const signUp = useCallback(async (input: SignUpInput) => {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: callbackUrl(),
        data: {
          full_name: input.fullName,
          phone: input.phone ?? null,
          company_name: input.companyName ?? null,
          role: input.role,
        },
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(describeError(error));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  const resendVerification = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) throw new Error(error.message);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl(),
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(describeError(error));
  }, []);

  /**
   * Legacy path — kept so existing components don't break. Supabase's own
   * magic-link callback (handled by detectSessionInUrl) signs users in
   * automatically, so this is only used if an explicit token hash arrives.
   */
  const verifyEmailToken = useCallback(
    async (tokenHash: string, type: "signup" | "recovery") => {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (error) throw new Error(describeError(error));
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    },
    [],
  );

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.refreshSession();
    setSession(data.session);
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  }, [queryClient]);

  const permissions = useMemo<AdminPermission[]>(
    () => permissionsQuery.data ?? [],
    [permissionsQuery.data],
  );

  const hasPermission = useCallback(
    (permission: AdminPermission) => permissions.includes(permission),
    [permissions],
  );

  const value = useMemo<AuthContextValue>(() => {
    const profile = profileQuery.data ?? null;
    return {
      session,
      user: session?.user ?? null,
      profile,
      permissions,
      isLoading: initialising || (Boolean(userId) && profileQuery.isLoading),
      isEmailVerified: Boolean(
        session?.user.email_confirmed_at ?? session?.user.confirmed_at,
      ),
      isApproved: profile?.account_status === "APPROVED",
      signUp,
      signIn,
      signOut,
      resendVerification,
      requestPasswordReset,
      updatePassword,
      verifyEmailToken,
      refresh,
      hasPermission,
    };
  }, [
    session,
    profileQuery.data,
    profileQuery.isLoading,
    permissions,
    initialising,
    userId,
    signUp,
    signIn,
    signOut,
    resendVerification,
    requestPasswordReset,
    updatePassword,
    verifyEmailToken,
    refresh,
    hasPermission,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}