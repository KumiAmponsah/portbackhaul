import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  User as UserIcon,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { initials } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface AppShellProps {
  nav: NavItem[];
  children: React.ReactNode;
  /** Shown above the nav list, e.g. "Clearing Agent". */
  sectionLabel?: string;
}

export function AppShell({ nav, children, sectionLabel }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const { profile, signOut } = useAuth();
  const unread = useUnreadCount();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* ---- sidebar (desktop) ---- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col bg-sidebar lg:flex">
        <div className="px-6 py-7">
          <Link to="/" aria-label="PortBackhaul home">
            <Logo tone="light" />
          </Link>
        </div>

        {sectionLabel ? (
          <p className="px-6 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
            {sectionLabel}
          </p>
        ) : null}

        <nav className="flex-1 space-y-0.5 px-3" aria-label="Sections">
          {nav.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="mx-6 mb-7 border-t border-sidebar-border pt-5">
          <p className="text-sm leading-relaxed text-white/55">
            Trusted logistics
            <br />
            for a stronger Ghana.
          </p>
        </div>
      </aside>

      {/* ---- mobile drawer ---- */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-secondary/60"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-fade relative flex h-full w-[264px] flex-col bg-sidebar">
            <div className="flex items-center justify-between px-5 py-6">
              <Logo tone="light" />
              <button
                type="button"
                className="rounded p-2 text-white/70 hover:text-white"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 px-3" aria-label="Sections">
              {nav.map((item) => (
                <SidebarLink key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      {/* ---- main column ---- */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[250px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="lg:hidden">
              <Logo showTagline={false} />
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/app/notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-background" />
              ) : null}
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-md py-1.5 pl-1.5 pr-2 transition-colors hover:bg-muted"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-white">
                    {initials(profile?.full_name ?? profile?.email)}
                  </span>
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-semibold text-foreground">
                      {profile?.full_name ?? "Account"}
                    </span>
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {profile ? ROLE_LABEL[profile.role] : ""}
                    </span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-1.5">
                  <span className="truncate text-sm">{profile?.email}</span>
                  {profile ? <StatusBadge status={profile.account_status} raw /> : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile & verification
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void handleSignOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-7 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-white before:absolute before:inset-y-1.5 before:-left-3 before:w-1 before:rounded-r before:bg-sidebar-primary"
            : "text-white/65 hover:bg-sidebar-accent/60 hover:text-white",
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {item.label}
    </NavLink>
  );
}

/** Shared page container width for dashboard screens. */
export function AppPage({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1400px] animate-fade space-y-7">{children}</div>;
}
