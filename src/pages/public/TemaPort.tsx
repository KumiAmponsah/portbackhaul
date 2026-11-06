import { Anchor, Clock, Container, Route, Truck } from "lucide-react";

import {
  CallToAction,
  ComplianceNote,
  FeatureCard,
  Section,
  SectionHeading,
} from "@/components/public/marketing";
import { Seo } from "@/components/Seo";
import { SITE_URL } from "@/lib/domain";

const DESTINATIONS = [
  { city: "Accra", note: "Short-haul distribution and warehousing runs" },
  { city: "Kumasi", note: "Ashanti Region trade and manufacturing inputs" },
  { city: "Takoradi", note: "Western Region coastal corridor" },
  { city: "Tamale", note: "Northern Region long-haul" },
  { city: "Bolgatanga", note: "Upper East, feeding the Paga border" },
  { city: "Ouagadougou", note: "Burkina Faso transit via Paga" },
];

export default function TemaPort() {
  return (
    <>
      <Seo
        title="Tema Port Haulage | Book Verified Trucks from Tema | PortBackhaul"
        description="Arrange road haulage out of Tema Port with verified trucks and drivers. Match container, bulk and general cargo to suitable carriers for delivery across Ghana and into West Africa."
        path="/tema-port"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Port haulage coordination",
          provider: { "@type": "Organization", name: "PortBackhaul", url: SITE_URL },
          areaServed: { "@type": "Place", name: "Tema Port, Ghana" },
          description:
            "Coordination of road freight from Tema Port to destinations across Ghana and neighbouring West African countries using verified trucks and drivers.",
        }}
      />

      <Section tone="navy">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Corridor</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Haulage out of Tema Port
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Tema is Ghana's busiest gateway. PortBackhaul helps clearing agents working out of Tema find verified trucks
          with the right capacity, in the right place, at the right time.
        </p>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="What moves through here"
          title="Cargo types we coordinate from Tema"
          description="From containerised consumer goods to bulk agricultural exports heading inland."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={Container} title="Containerised cargo">
            Full-container movements to inland destinations, matched to container chassis and flatbed carriers with the
            correct capacity.
          </FeatureCard>
          <FeatureCard icon={Truck} title="Bulk and bagged goods">
            Grain, fertiliser, cocoa and bagged commodities matched to flatbed and box trucks, with handling
            requirements such as tarpaulin cover recorded on the request.
          </FeatureCard>
          <FeatureCard icon={Route} title="General and project cargo">
            Steel, machinery, building materials and mixed loads, with truck type and capacity specified by the
            clearing agent.
          </FeatureCard>
          <FeatureCard icon={Anchor} title="Trucks near the port">
            Matching prioritises verified trucks already positioned near Tema, reducing repositioning time before
            pickup.
          </FeatureCard>
          <FeatureCard icon={Clock} title="Pickup windows that hold">
            Requests carry a pickup date and time. Drivers accept against that window, and loading is confirmed by
            scanning the trip QR code.
          </FeatureCard>
          <FeatureCard icon={Truck} title="Backhaul opportunities">
            Trucks delivering inland can pick up return loads, reducing empty running on the corridor.
          </FeatureCard>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading eyebrow="Destinations" title="Where Tema cargo goes" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((destination) => (
            <div key={destination.city} className="panel p-5">
              <p className="flex items-center gap-2 text-base font-bold">
                <Route className="h-4 w-4 text-accent" aria-hidden />
                Tema Port → {destination.city}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">{destination.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <ComplianceNote />

      <CallToAction
        title="Moving cargo through Tema?"
        description="Register, get verified and start matching your loads with carriers you can check."
        secondaryLabel="Ghana to Burkina Faso"
        secondaryTo="/ghana-to-burkina-faso"
      />
    </>
  );
}