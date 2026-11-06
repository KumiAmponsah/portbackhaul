import { Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ComplianceNote, Section, SectionHeading } from "@/components/public/marketing";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SITE_URL } from "@/lib/domain";

export default function Contact() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [topic, setTopic] = useState<string>("GENERAL");
  const [message, setMessage] = useState<string>("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Opens the visitor's mail client — no third-party form processor is involved.
    const subject = encodeURIComponent(`[${topic}] PortBackhaul enquiry from ${name || "website"}`);
    const body = encodeURIComponent(`${message}\n\n—\n${name}\n${email}`);
    window.location.href = `mailto:hello@portbackhaul.com?subject=${subject}&body=${body}`;
    toast.success("Opening your email app with the message ready to send.");
  }

  return (
    <>
      <Seo
        title="Contact PortBackhaul | Ghana Port Haulage Support"
        description="Get in touch with the PortBackhaul team about shipments, driver registration, clearing agent onboarding, account verification or partnership enquiries."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: `${SITE_URL}/contact`,
          name: "Contact PortBackhaul",
        }}
      />

      <Section tone="navy">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Contact</p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          Talk to the PortBackhaul team
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Questions about onboarding, verification, a shipment in progress or working with us — we'd like to hear from
          you.
        </p>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <SectionHeading eyebrow="Send a message" title="How can we help?" />

            <form onSubmit={handleSubmit} className="panel mt-8 space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Your name</Label>
                  <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email address</Label>
                  <Input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-topic">What is this about?</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger id="c-topic">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General enquiry</SelectItem>
                    <SelectItem value="SHIPPER">I have cargo to move</SelectItem>
                    <SelectItem value="AGENT">Clearing agent onboarding</SelectItem>
                    <SelectItem value="DRIVER">Driver onboarding</SelectItem>
                    <SelectItem value="VERIFICATION">Account verification</SelectItem>
                    <SelectItem value="SUPPORT">Support with a live shipment</SelectItem>
                    <SelectItem value="OTHER">Something else</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-message">Message</Label>
                <Textarea id="c-message" rows={6} required value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>

              <Button type="submit" size="lg">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send message
              </Button>
            </form>
          </div>

          <aside className="space-y-5">
            <div className="panel p-6">
              <h2 className="text-base font-bold">Reach us directly</h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium">Email</span>
                    <a href="mailto:hello@portbackhaul.com" className="text-muted-foreground hover:text-primary">
                      hello@portbackhaul.com
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium">Support hours</span>
                    <span className="text-muted-foreground">Monday to Saturday, 07:00–19:00 GMT</span>
                  </span>
                </li>
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium">Corridors served</span>
                    <span className="text-muted-foreground">
                      Tema Port, Takoradi Port and onward routes across Ghana, Burkina Faso, Mali, Niger and Togo.
                    </span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="panel p-6">
              <h2 className="text-base font-bold">Account verification</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                If your account is pending, rejected, suspended or blocked, the reason and next step appear inside your
                account. We never ask for payment to approve an account.
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <ComplianceNote />
    </>
  );
}