import {
  Anchor,
  ArrowRight,
  ClipboardCheck,
  MapPin,
  QrCode,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  CallToAction,
  ComplianceNote,
  FeatureCard,
  Section,
  SectionHeading,
  StatRow,
  WorkflowDiagram,
} from "@/components/public/marketing";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { SITE_URL } from "@/lib/domain";

export default function Home() {
  return (
    <>
      <Seo
        title="PortBackhaul | Ghana Port Haulage & Truck Matching from Tema and Takoradi"
        description="PortBackhaul connects clearing agents and verified drivers for road freight from Tema Port and Takoradi Port to destinations across Ghana and West Africa."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PortBackhaul",
          url: SITE_URL,
          description:
            "Road freight coordination platform connecting clearing agents and drivers across Ghana and West Africa.",
          areaServed: ["Ghana", "Burkina Faso", "Mali", "Niger", "Togo"],
        }}
      />

      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden bg-sidebar px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.15]">
          <svg className="h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M48 0H0v48" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1200" height="600" fill="url(#hero-grid)" />
            <path
              d="M120 520 C 320 470, 420 330, 640 270 S 940 150, 1090 90"
              fill="none"
              stroke="hsl(var(--sidebar-primary))"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-draw"
            />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80">
              <Anchor className="h-3.5 w-3.5 text-accent" aria-hidden />
              Tema Port · Takoradi Port · West African corridors
            </p>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Move cargo off the port and onto a verified truck.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              PortBackhaul gives clearing agents and drivers one shared record of every shipment — from the moment
              cargo is booked to the moment delivery is confirmed and the carrier is paid.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90">
                <Link to="/register">
                  Create your account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
              The shipment journey
            </p>
            <WorkflowDiagram />
          </div>

          <div className="mt-16 border-t border-white/10 pt-10">
            <StatRow
              items={[
                { value: "2", label: "Roles coordinated on one record" },
                { value: "100%", label: "Trucks and drivers verified before matching" },
                { value: "0", label: "Payments released before delivery is confirmed" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ---------------- what it does ---------------- */}
      <Section>
        <SectionHeading
          eyebrow="Why PortBackhaul"
          title="Port haulage without the phone calls and paperwork chase"
          description="Everyone who touches the cargo works from the same status, the same documents and the same verified assignment record."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={ClipboardCheck} title="One shipment record">
            Cargo details, consignee, route and handling instructions are captured once by the clearing agent and
            shared with the driver who needs them — no re-keying between WhatsApp, email and spreadsheets.
          </FeatureCard>
          <FeatureCard icon={Truck} title="Verified truck matching">
            Requests are matched on truck type, capacity, proximity to the port, availability and document verification
            status. Nearest suitable verified carrier first.
          </FeatureCard>
          <FeatureCard icon={QrCode} title="QR trip verification">
            Every accepted job creates a trip with a secure QR code. The QR is scanned at the loading point to confirm
            the driver, truck and cargo before loading.
          </FeatureCard>
          <FeatureCard icon={MapPin} title="Tracking while it matters">
            Location is shared only while a trip is active, at sensible intervals — enough visibility for the clearing
            agent, without draining a driver's battery or tracking anyone off duty.
          </FeatureCard>
          <FeatureCard icon={Wallet} title="Payment on confirmed delivery">
            Transport fees are held and released after delivery is confirmed with a code, a named receiver and
            evidence. The platform commission is transparent and configurable.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Verified accounts only">
            Every clearing agent and driver submits documents and is reviewed by our team before they can transact on
            the marketplace.
          </FeatureCard>
        </div>
      </Section>

      {/* ---------------- audiences ---------------- */}
      <Section tone="surface">
        <SectionHeading
          eyebrow="Built for the whole chain"
          title="Find your place in the movement"
          description="Each role gets a workspace designed for the job they actually do."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <AudienceCard
            to="/clearing-agents"
            title="Clearing agents"
            description="Register cargo, request matching trucks and monitor every trip in progress."
          />
          <AudienceCard
            to="/truck-drivers"
            title="Drivers"
            description="Accept jobs, run trips, get paid after confirmed delivery."
          />
        </div>
      </Section>

      {/* ---------------- corridors ---------------- */}
      <Section>
        <SectionHeading
          eyebrow="Corridors"
          title="From the quayside to the last mile"
          description="Ghana's ports feed a road network that reaches deep into the Sahel. PortBackhaul is built for those distances."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <CorridorCard
            to="/tema-port"
            title="Tema Port haulage"
            description="Container and bulk haulage out of Ghana's largest port to Accra, Kumasi, Tamale and beyond."
          />
          <CorridorCard
            to="/ghana-to-burkina-faso"
            title="Ghana to Burkina Faso"
            description="Long-haul transit along the Tema–Paga–Ouagadougou corridor with verified carriers and tracked trips."
          />
        </div>
      </Section>

      <ComplianceNote />

      <CallToAction
        title="Ready to move your next shipment?"
        description="Create an account, submit your verification documents and start coordinating freight with people you can check."
      />
    </>
  );
}

function AudienceCard({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link to={to} className="panel group flex flex-col p-6 transition-all hover:border-primary/40">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        Learn more
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

function CorridorCard({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-lg border border-border bg-secondary p-8 text-white transition-all hover:border-accent"
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-20">
        <svg viewBox="0 0 400 200" className="h-full w-full">
          <path
            d="M20 170 C 120 140, 160 80, 260 60 S 360 30, 385 20"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="20" cy="170" r="6" fill="hsl(var(--accent))" />
          <circle cx="385" cy="20" r="6" fill="hsl(var(--accent))" />
        </svg>
      </span>
      <div className="relative">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">{description}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          Explore the corridor
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}