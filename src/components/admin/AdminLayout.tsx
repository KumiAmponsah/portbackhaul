import {
  ClipboardList,
  CreditCard,
  FileText,
  LayoutGrid,
  MapPin,
  Plug,
  ScrollText,
  Settings,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { AppShell, type NavItem } from "@/components/app/AppShell";

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/cargo", label: "Cargo", icon: FileText },
  { to: "/admin/trucks", label: "Trucks", icon: Truck },
  { to: "/admin/drivers", label: "Drivers", icon: Users },
  { to: "/admin/clearing-agents", label: "Clearing Agents", icon: ShieldCheck },
  { to: "/admin/trips", label: "Trips", icon: MapPin },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/disputes", label: "Disputes", icon: ClipboardList },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/integrations", label: "Integrations", icon: Plug },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell nav={ADMIN_NAV} sectionLabel="Administration">
      {children}
    </AppShell>
  );
}
