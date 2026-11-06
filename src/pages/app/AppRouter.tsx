import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";

import { AppShell, type NavItem } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_HOME, ROLE_LABEL, type Role } from "@/lib/roles";

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  CLEARING_AGENT: [
    { to: "/app/agent/new-cargo", label: "New Cargo", icon: FileText },
    { to: "/app/agent/request-truck", label: "Request Truck", icon: Truck },
    { to: "/app/agent/available-trucks", label: "Available Trucks", icon: Users },
    { to: "/app/agent/trips", label: "Active Trips", icon: MapPin },
    { to: "/app/agent/completed", label: "Completed", icon: CheckCircle2 },
  ],
  DRIVER: [
    { to: "/app/driver", label: "My Jobs", icon: Truck, end: true },
    { to: "/app/driver/trips", label: "My Trips", icon: MapPin },
    { to: "/app/driver/earnings", label: "Earnings", icon: Bell },
    { to: "/app/notifications", label: "Notifications", icon: Bell },
  ],
  ADMIN: [{ to: "/admin", label: "Admin Dashboard", icon: ClipboardList }],
};

/** Role-aware application shell shared by every authenticated non-admin screen. */
export function AppLayout() {
  const { profile } = useAuth();
  if (!profile) return null;

  return (
    <AppShell nav={NAV_BY_ROLE[profile.role]} sectionLabel={ROLE_LABEL[profile.role]}>
      <Outlet />
    </AppShell>
  );
}

/** /app redirects each role to its own home screen. */
export function AppIndexRedirect() {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.account_status !== "APPROVED") return <Navigate to="/app/account-status" replace />;
  return <Navigate to={ROLE_HOME[profile.role]} replace />;
}

export type { LucideIcon };