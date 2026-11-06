import { FileText, MapPin, ShieldCheck, Timer, Truck } from "lucide-react";

import {
  CallToAction,
  ComplianceNote,
  FeatureCard,
  Section,
  SectionHeading,
} from "@/components/public/marketing";
import { Seo } from "@/components/Seo";
import { SITE_URL } from "@/lib/domain";

const LEGS = [
  { from: "Tema Port", to: "Accra", note: "Port exit and city bypass" },
  { from: "Accra", to: "Kumasi", note: "Central spine of the corridor" },
  { from: "Kumasi", to: "Tamale", note: "Northern long-haul leg" },
  { from: "Tamale", to: "Bolgatanga", note: "Upper East approach" },
  { from: "Bolgatanga", to: "Paga Border", note: "Ghana–Burkina Faso crossing" },
  { from: "Paga Border", to: "Ouagadougou", note: "Final leg into Burkina Faso" },
];

export default function GhanaBurkinaFaso() {
  return (
    <>
      <Seo
        title="Ghana to Burkina Faso Freight | Tema to Ouagadougou Trucking | PortBackhaul"
        description="Coordinate long-haul road freight from Tema Port and Takoradi Port to Ouagadougou and Bobo-Dioulasso. Verified carriers, tracked trips and delivery confirmation on the Ghana–Burkina Faso corridor."
        path="/ghana-to-burkina-faso"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Cross-border road freight coordination",
          provider: { "@type": "Organization", name: "PortBackhaul", url: SITE_URL },
          areaServed: [
            { "@type": "Country", name: "Ghana" },
            { "@type": "Country", name: "Burkina Faso" },
          ],
        }}
      />

      <Section tone="green">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Corridor</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Ghana to Burkina Faso, tracked the whole way
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          The Tema–Paga–Ouagadougou route is one of West Africa's most important transit corridors. Long distances make
          visibility and verified carriers matter more, not less.
        </p>
      </Section>

      <Section>
        <SectionHeading eyebrow="The route" title="Leg by leg to Ouagadougou" />
        <ol className="mt-10 space-y-3">
          {LEGS.map((leg, index) => (
            <li key={leg.to} className="panel flex items-center gap-4 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 font-mono text-sm font-bold tabular text-accent">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold">
                  {leg.from} <span className="text-muted-foreground">→</span> {leg.to}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{leg.note}</p>
              </div>
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow="Why it works on this corridor"
          title="Long-haul transit needs a shared record"
          description="Days on the road across two countries is exactly where phone-call coordination breaks down."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={Truck} title="Carriers who run the route">
            Match with verified drivers whose trucks have the capacity and type suited to long-haul transit loads.
          </FeatureCard>
          <FeatureCard icon={MapPin} title="Visibility across the distance">
            Location updates while the trip is active mean the clearing agent in Tema and the consignee in
            Ouagadougou see the same position.
          </FeatureCard>
          <FeatureCard icon={Timer} title="Status you can rely on">
            Assigned, driver accepted, loaded, in transit, arrived — each change timestamped and attributable.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Verified at both ends">
            Drivers and trucks carry verification status into every job. Loading is confirmed by scanning the trip QR
            code.
          </FeatureCard>
          <FeatureCard icon={FileText} title="Delivery proof that travels">
            Delivery code, receiver name, timestamp and uploaded evidence close out the trip wherever it ends.
          </FeatureCard>
          <FeatureCard icon={Truck} title="Return loads">
            Carriers heading back toward the coast can pick up southbound cargo instead of running empty.
          </FeatureCard>
        </div>
      </Section>

      <Section>
        <div className="panel mx-auto max-w-3xl p-6">
          <h2 className="text-lg font-bold">About cross-border formalities</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Transit across the Ghana–Burkina Faso border involves customs, transit declarations and border procedures
            handled by licensed parties under the relevant national authorities. PortBackhaul coordinates the road
            freight and records the platform's own logistics milestones. It does not perform, replace or represent any
            customs or border process, and it does not display any government status unless an authorised integration
            has been formally configured and verified.
          </p>
        </div>
      </Section>

      <ComplianceNote />

      <CallToAction
        title="Running the northern corridor?"
        description="Whether you ship it or haul it, register and get verified to coordinate transit loads with people you can check."
        secondaryLabel="Tema Port haulage"
        secondaryTo="/tema-port"
      />
    </>
  );
}