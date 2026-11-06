import { CreditCard, Map, Plug, ShieldAlert, Smartphone } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Seo } from "@/components/Seo";
import { useCustomsIntegrations } from "@/hooks/use-platform-data";
import { CUSTOMS_DISCLAIMER } from "@/lib/customsIntegration";

const PLATFORM_INTEGRATIONS = [
  {
    icon: CreditCard,
    name: "Paystack",
    purpose: "Card and mobile money collection, transfers and payout processing.",
    requirement:
      "Requires a live Paystack business account. The secret key is stored only as a server-side secret; the webhook is verified by signature.",
  },
  {
    icon: Smartphone,
    name: "Firebase Cloud Messaging",
    purpose: "Push notifications to drivers and agents on mobile devices.",
    requirement: "Requires a Firebase project and server credentials held server-side.",
  },
  {
    icon: Map,
    name: "Map provider",
    purpose: "Road-accurate basemaps and routing for trip tracking.",
    requirement:
      "The app uses a provider abstraction, so Mapbox, Google Maps or MapLibre can be connected without changing screens.",
  },
];

export default function AdminIntegrations() {
  const { data: customs, isLoading, isError, error, refetch } = useCustomsIntegrations();

  return (
    <div className="mx-auto w-full max-w-[1000px] animate-fade space-y-6">
      <Seo title="Integrations · PortBackhaul Admin" description="External integration status." path="/admin/integrations" noIndex />

      <PageHeader
        eyebrow="Admin Dashboard"
        title="Integrations"
        subtitle="External systems this platform can connect to, and their current connection state."
      />

      <section className="panel p-6">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <ShieldAlert className="h-4 w-4 text-status-danger" aria-hidden />
          Government & port systems
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{CUSTOMS_DISCLAIMER}</p>

        <div className="mt-5 space-y-3">
          {isError ? (
            <QueryErrorState error={error} onRetry={() => void refetch()} subject="integration status" compact />
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading integration status…</p>
          ) : (
            (customs ?? []).map((integration) => (
              <div key={integration.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{integration.display_name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{integration.authority}</p>
                  </div>
                  <span className="rounded bg-status-neutral-bg px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-status-neutral">
                    {integration.connection_status.replace(/_/g, " ")}
                  </span>
                </div>
                {integration.notes ? (
                  <p className="mt-2.5 text-sm text-muted-foreground">{integration.notes}</p>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="mt-5 rounded-lg border border-status-danger/25 bg-status-danger-bg p-4">
          <p className="text-xs leading-relaxed text-status-danger">
            <span className="font-bold uppercase tracking-wide">Compliance control. </span>
            No administrator, agent or user can set a Customs, ICUMS or port-authority status inside PortBackhaul. The
            integration layer returns <span className="font-mono">INTEGRATION_NOT_CONNECTED</span> until an authorised
            API is formally configured and verified, and the interface will never display an official status derived
            from any other source.
          </p>
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Plug className="h-4 w-4" aria-hidden />
          Platform services
        </h2>
        <div className="mt-5 space-y-3">
          {PLATFORM_INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;
            return (
              <div key={integration.name} className="flex gap-3 rounded-lg border border-border p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{integration.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{integration.purpose}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{integration.requirement}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
