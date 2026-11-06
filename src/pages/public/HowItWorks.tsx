import { CallToAction, ComplianceNote, Section, SectionHeading, WorkflowDiagram } from "@/components/public/marketing";
import { Seo } from "@/components/Seo";
import { SITE_URL } from "@/lib/domain";

const STEPS = [
  {
    title: "The clearing agent registers a shipment",
    body: "Cargo description, quantity, weight, container number, consignee, pickup location, expected pickup date and any special handling instructions are captured once. PortBackhaul issues an internal Cargo ID for the record — a platform reference, not an official customs reference.",
  },
  {
    title: "The agent moves it through clearance",
    body: "As the clearance workflow progresses, the agent updates the operational status — clearance in progress, ready for transport and so on — so everyone downstream works from the same record.",
  },
  {
    title: "The agent requests a suitable truck",
    body: "The agent specifies truck type, required capacity, route and pickup window. PortBackhaul ranks verified, available trucks by proximity to the pickup point, capacity fit and driver availability.",
  },
  {
    title: "A matched driver is notified and decides",
    body: "The driver receives the route, cargo type, weight, pickup location, pickup time, transport fee and job ID, and can accept or decline. Nothing is assigned automatically unless an administrator explicitly enables that setting.",
  },
  {
    title: "Acceptance creates a trip and a QR code",
    body: "A trip record links the shipment, driver, truck and clearing agent. A secure QR code is generated containing only a random token — never cargo details or personal data.",
  },
  {
    title: "Loading is verified before the truck moves",
    body: "The trip QR code is scanned at the loading point. The backend confirms the trip is active, the driver and truck are assigned and the token is valid, then records the arrival and loading confirmations in the audit log.",
  },
  {
    title: "The trip is tracked while it is active",
    body: "Once the driver starts the trip, location is shared at sensible intervals and stops when the trip ends. The clearing agent sees the route, current position, status and last update time.",
  },
  {
    title: "Delivery is confirmed with evidence",
    body: "On arrival, the clearing agent issues a one-time delivery code. The driver records the receiver's name, enters the code and uploads photo or document evidence. The trip moves to delivered.",
  },
  {
    title: "Payment is released after confirmation",
    body: "Transport fees are held until delivery conditions are satisfied. The platform commission is applied, driver earnings are calculated and a payout is created. No funds move automatically before confirmation.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <Seo
        title="How PortBackhaul Works | Port to Door Freight Coordination in Ghana"
        description="A step-by-step guide to moving cargo with PortBackhaul: shipment registration, clearing agent workflow, verified truck matching, driver acceptance, QR loading verification, GPS tracking, delivery confirmation and payment release."
        path="/how-it-works"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to move cargo with PortBackhaul",
          description:
            "Coordinate road freight from Ghana's ports between clearing agents and drivers.",
          url: `${SITE_URL}/how-it-works`,
          step: STEPS.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.body,
          })),
        }}
      />

      <Section tone="green">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">How it works</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          From port gate to consignee, on one shared record
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Every step produces a verifiable record, so nobody has to take anybody's word for where the cargo is.
        </p>
        <div className="mt-12">
          <WorkflowDiagram />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Step by step" title="The full shipment journey" />

        <ol className="mt-12 space-y-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="panel flex gap-5 p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary font-mono text-lg font-extrabold tabular text-primary-foreground">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-bold">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="surface">
        <SectionHeading
          eyebrow="Trust & safety"
          title="What keeps the platform honest"
          description="Verification, permissions and an audit trail that ordinary users cannot edit."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            {
              title: "Every account is reviewed",
              body: "Clearing agents and drivers submit role-appropriate documents and are approved, rejected or asked for more information by an authorised administrator.",
            },
            {
              title: "Roles see only what they should",
              body: "Clearing agents see their own shipments and the trucks and drivers they have requested. Drivers see the trips assigned to them and the cargo details needed to carry out the job. Administrators access records according to their specific permissions.",
            },
            {
              title: "Sensitive actions run server-side",
              body: "Approvals, blocking, QR verification, protected status transitions, payment confirmation and payouts all execute on secure backend functions — never in the browser.",
            },
            {
              title: "Actions are logged, not editable",
              body: "Account decisions, assignments, acceptances, QR scans, loading confirmations, status changes, delivery confirmations and payment events are written to an immutable audit trail.",
            },
          ].map((item) => (
            <div key={item.title} className="panel p-6">
              <h3 className="text-base font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <ComplianceNote />

      <CallToAction
        title="See it working on your own shipment"
        description="Create an account, complete verification and run your next load through the platform."
        secondaryLabel="Contact us"
        secondaryTo="/contact"
      />
    </>
  );
}