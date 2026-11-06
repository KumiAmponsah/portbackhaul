import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_HOME } from "@/lib/roles";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/clearing-agents", label: "Clearing Agents" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/tema-port", label: "Tema Port" },
  { to: "/contact", label: "Contact" },
];

export function PublicLayout() {
  const [open, setOpen] = useState<boolean>(false);
  const { session, profile } = useAuth();

  const dashboardHref = profile ? ROLE_HOME[profile.role] : "/app";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="PortBackhaul home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {session ? (
              <Button asChild size="sm">
                <Link to={dashboardHref}>Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Create account</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-border bg-background lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6" aria-label="Mobile">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded px-3 py-2.5 text-sm font-medium",
                      isActive ? "bg-muted text-foreground" : "text-muted-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                {session ? (
                  <Button asChild className="flex-1" onClick={() => setOpen(false)}>
                    <Link to={dashboardHref}>Open dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                      <Link to="/login">Sign in</Link>
                    </Button>
                    <Button asChild className="flex-1" onClick={() => setOpen(false)}>
                      <Link to="/register">Create account</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border bg-secondary text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm text-white/65">
            Trusted road-freight coordination between Ghana's ports and West African destinations.
          </p>
        </div>

        <FooterColumn
          title="For your business"
          links={[
            { to: "/clearing-agents", label: "Clearing agents" },
            { to: "/how-it-works", label: "How it works" },
          ]}
        />
        <FooterColumn
          title="Corridors"
          links={[
            { to: "/tema-port", label: "Tema Port haulage" },
            { to: "/ghana-to-burkina-faso", label: "Ghana to Burkina Faso" },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { to: "/contact", label: "Contact" },
            { to: "/privacy", label: "Privacy policy" },
            { to: "/terms", label: "Terms of service" },
          ]}
        />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-white/50 sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} PortBackhaul. PortBackhaul is an independent logistics coordination
            platform. It is not a customs broker and is not connected to any government or port authority system.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="text-sm text-white/80 transition-colors hover:text-accent">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}