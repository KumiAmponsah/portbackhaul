import { ArrowRight, Bell, ClipboardList, Search, ShieldCheck, Truck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import {
  CallToAction,
  ComplianceNote,
  FeatureCard,
  Section,
  SectionHeading,
} from "@/components/public/marketing";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";

export default function ClearingAgents() {
  return (
    <>
      <Seo
        title="Clearing Agents | Request Verified Trucks & Monitor Trips | PortBackhaul"
        description="PortBackhaul gives licensed clearing agents a dashboard for new cargo records, verified truck requests, driver acceptance and live trip monitoring across Ghana's port corridors."
        path="/clearing-agents"
      />

      <Section tone="navy">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
          For clearing agents
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Find the right truck in minutes, not hours of calls
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Register cargo, request a truck that actually fits the load, and watch every job you're responsible for from
          one operational dashboard.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90">
            <Link to="/register">
              Register your agency
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/how-it-works">How it works</Link>
          </Button>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Your dashboard"
          title="Built around how agents actually work"
          description="New cargo records, active shipments, truck requests and completed jobs — organised by the status that matters to you right now."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={ClipboardList} title="New cargo records">
            Register a shipment once. Review its full details, then move it through the clearance workflow from a
            single screen.
          </FeatureCard>
          <FeatureCard icon={Search} title="Intelligent truck matching">
            Specify truck type, capacity, route and pickup window. We rank verified trucks by proximity to the pickup
            point, suitability and driver availability.
          </FeatureCard>
          <FeatureCard icon={Bell} title="Driver acceptance, not guesswork">
            The matched driver is notified with the route, cargo, weight, pickup time and fee — and must accept before a
            trip is created.
          </FeatureCard>
          <FeatureCard icon={Truck} title="Monitor loading and transit">
            Loading is confirmed by scanning the trip QR code. You see each confirmation as it happens.
          </FeatureCard>
          <FeatureCard icon={Users} title="One view of every job">
            Filter across clearance in progress, ready for transport, truck requested, truck assigned and in transit.
          </FeatureCard>
          <FeatureCard icon={ShieldCheck} title="Only verified carriers">
            Trucks and drivers must pass document verification before they appear in your matching results.
          </FeatureCard>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Compliance first"
              title="Operational status only — never an official one"
            />
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              PortBackhaul tracks your own operational milestones: clearance in progress, ready for transport, truck
              assigned, loading, in transit, delivered. These are the platform's logistics workflow records.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The platform does not let anyone — including administrators — create or approve a Customs, ICUMS or port
              authority status. Official clearance remains entirely outside this system, with the licensed parties
              responsible for it.
            </p>
          </div>

          <div className="panel p-6">
            <p className="eyebrow mb-4">Shipment status flow</p>
            <ol className="space-y-3">
              {[
                "SUBMITTED",
                "CLEARANCE_IN_PROGRESS",
                "READY_FOR_TRANSPORT",
                "TRUCK_REQUESTED",
                "TRUCK_ASSIGNED",
                "LOADING",
                "IN_TRANSIT",
                "DELIVERED",
              ].map((status, index) => (
                <li key={status} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-bold tabular text-primary">
                    {index + 1}
                  </span>
                  <span className="font-mono text-sm font-semibold">{status}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <ComplianceNote />

      <CallToAction
        title="Put your next truck request on the platform"
        description="Register your clearing agency, verify your licence and documents, and start matching cargo with carriers you can check."
        primaryLabel="Register as a clearing agent"
        secondaryLabel="Contact us"
        secondaryTo="/contact"
      />
    </>
  );
}