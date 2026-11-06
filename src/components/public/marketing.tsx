import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  tone = "canvas",
}: {
  children: ReactNode;
  className?: string;
  tone?: "canvas" | "surface" | "navy" | "green";
}) {
  const toneClass =
    tone === "surface"
      ? "bg-card"
      : tone === "navy"
        ? "bg-secondary text-white"
        : tone === "green"
          ? "bg-sidebar text-white"
          : "bg-background";

  return (
    <section className={cn("px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24", toneClass, className)}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: "dark" | "light";
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-[11px] font-bold uppercase tracking-[0.14em]",
            tone === "light" ? "text-accent" : "text-primary",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-3xl font-extrabold tracking-tight sm:text-4xl",
          tone === "light" ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed",
            tone === "light" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="panel p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

/** The shipment → clearance → truck → delivery chain, used across the marketing site. */
export function WorkflowDiagram({ className }: { className?: string }) {
  const steps = [
    { label: "Shipment registered", detail: "Clearing agent" },
    { label: "Clearance handled", detail: "Clearing agent" },
    { label: "Verified truck matched", detail: "Driver accepts" },
    { label: "Loading verified", detail: "QR scan at pickup" },
    { label: "Delivered & paid", detail: "Confirmed on arrival" },
  ];

  return (
    <div className={cn("relative", className)}>
      <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className="animate-rise relative rounded-lg border border-white/15 bg-white/[0.06] p-4 backdrop-blur"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white tabular">
              {index + 1}
            </span>
            <p className="mt-3 text-sm font-bold text-white">{step.label}</p>
            <p className="mt-1 text-xs text-white/60">{step.detail}</p>
            {index < steps.length - 1 ? (
              <span
                className="absolute right-[-11px] top-1/2 hidden h-px w-5 -translate-y-1/2 bg-white/25 lg:block"
                aria-hidden
              />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CallToAction({
  title,
  description,
  primaryLabel = "Create your account",
  primaryTo = "/register",
  secondaryLabel = "How it works",
  secondaryTo = "/how-it-works",
}: {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryTo?: string;
  secondaryLabel?: string;
  secondaryTo?: string;
}) {
  return (
    <Section tone="green">
      <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90">
            <Link to={primaryTo}>{primaryLabel}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link to={secondaryTo}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

export function ComplianceNote() {
  return (
    <Section tone="surface" className="!py-10">
      <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Important. </span>
        PortBackhaul is an independent road-freight coordination platform. It is not a customs broker and is not
        connected to Ghana Customs, GRA/ICUMS, GPHA or any port authority system. All official clearance,
        documentation and duty obligations remain with the licensed parties responsible for them.
      </p>
    </Section>
  );
}

export function StatRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className="grid gap-6 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="border-l-2 border-accent pl-4">
          <dt className="font-mono text-3xl font-extrabold tabular text-white">{item.value}</dt>
          <dd className="mt-1 text-sm text-white/60">{item.label}</dd>
        </div>
      ))}
    </dl>
  );
}