import type { ReactNode } from "react";

import { Section } from "@/components/public/marketing";
import { Seo } from "@/components/Seo";

const UPDATED = "19 September 2026";

function LegalPage({
  title,
  description,
  path,
  children,
}: {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
}) {
  return (
    <>
      <Seo title={title} description={description} path={path} />
      <Section tone="navy" className="!py-14">
        <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title.split(" | ")[0]}
        </h1>
        <p className="mt-3 text-sm text-white/60">Last updated {UPDATED}</p>
      </Section>
      <Section>
        <div className="prose prose-slate max-w-3xl prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-xl prose-p:leading-relaxed prose-li:leading-relaxed">
          {children}
        </div>
      </Section>
    </>
  );
}

export function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy | PortBackhaul"
      description="How PortBackhaul collects, uses, stores and protects personal data, verification documents and location information for users of its logistics platform."
      path="/privacy"
    >
      <p>
        This policy explains what information PortBackhaul collects, why we collect it, and the choices you have. It
        applies to our website and to the authenticated platform used by clearing agents, drivers and administrators.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> Name, email address, phone number, company name and the role you
          register under.
        </li>
        <li>
          <strong>Verification documents.</strong> Identity, licence, registration and tax documents you upload so an
          administrator can verify your account. These are stored in private storage and are never publicly
          accessible.
        </li>
        <li>
          <strong>Operational records.</strong> Shipments, truck and driver registrations, truck requests, trips,
          loading verifications, delivery confirmations, payments and payouts.
        </li>
        <li>
          <strong>Location information.</strong> For drivers only, and only while a trip is active. Location sharing
          stops when the trip ends and is not collected when a driver is off duty.
        </li>
        <li>
          <strong>Audit records.</strong> A record of significant actions taken on the platform, including who
          performed them and when.
        </li>
      </ul>

      <h2>How we use information</h2>
      <p>
        We use your information to operate the platform: to verify accounts, match cargo to suitable verified trucks,
        create and track trips, verify loading, confirm delivery, process transport payments and keep an accurate
        record of what happened. We also use it to send operational notifications about your own shipments, jobs and
        account status.
      </p>

      <h2>Who can see your information</h2>
      <p>
        Access is restricted by role. Clearing agents see their own shipments and the trucks and drivers they have
        requested. Drivers see the trips assigned to them and the cargo details needed to carry out the job.
        Authorised administrators access records according to their specific administrative permissions.
      </p>
      <p>
        Verification documents are accessible only to you and to administrators holding the document review
        permission. They are served through short-lived signed links, never public URLs.
      </p>

      <h2>Payment information</h2>
      <p>
        PortBackhaul does not store raw card details. Payment collection is handled by a regulated payment provider.
        Payment operations execute on secure server-side functions; no provider secret keys exist in the website or
        mobile application.
      </p>

      <h2>Data retention</h2>
      <p>
        Transaction history, audit history and status history are retained as business records, including where an
        account is suspended or blocked. You may request a copy of your personal data or ask us to correct it by
        contacting us.
      </p>

      <h2>Government and port systems</h2>
      <p>
        PortBackhaul is not connected to Ghana Customs, GRA/ICUMS, GPHA or any port authority system. We do not
        transmit your data to those systems, and we do not receive data from them, unless and until a formally
        authorised integration is configured, disclosed and verified.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions, email <a href="mailto:privacy@portbackhaul.com">privacy@portbackhaul.com</a>.
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage
      title="Terms of Service | PortBackhaul"
      description="The terms governing use of the PortBackhaul logistics coordination platform by clearing agents, drivers and administrators."
      path="/terms"
    >
      <p>
        These terms govern your use of PortBackhaul. By creating an account you agree to them. If you use
        PortBackhaul on behalf of a business, you confirm you are authorised to bind that business.
      </p>

      <h2>What PortBackhaul is</h2>
      <p>
        PortBackhaul is an independent road-freight coordination platform. It connects clearing agents and drivers,
        and records the logistics workflow between them.
      </p>
      <p>
        <strong>
          PortBackhaul is not a customs broker, freight forwarder of record, carrier, or government or port
          authority.
        </strong>{" "}
        It does not perform customs clearance, does not issue official documentation, and is not connected to Ghana
        Customs, GRA/ICUMS, GPHA or any port authority system. All statutory clearance, documentation and duty
        obligations remain with the licensed parties responsible for them.
      </p>

      <h2>Accounts and verification</h2>
      <p>
        Accounts are created as pending and must be reviewed before marketplace functions become available. You must
        provide accurate information and genuine documents. Submitting false or altered documents will result in
        rejection or blocking. Administrators may approve, reject, request further information, suspend or block an
        account, with a reason recorded.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Keep your login credentials confidential and your contact details current.</li>
        <li>Hold and maintain the licences, permits, registrations and insurance required for your role.</li>
        <li>Provide accurate cargo, weight, capacity and route information.</li>
        <li>Comply with all applicable road, transport, customs and border laws.</li>
      </ul>

      <h2>Digital assignment and QR codes</h2>
      <p>
        A trip's QR code is a PortBackhaul logistics verification and workflow record. It is not an official pass,
        permit, gate release or customs authorisation, and it does not replace any port security, customs or terminal
        process, unless a competent authority has formally authorised it for another purpose in writing.
      </p>

      <h2>Payments</h2>
      <p>
        Transport fees are agreed between the parties. PortBackhaul applies a platform commission, disclosed and
        configurable by the platform operator, and facilitates payment through a regulated provider. Funds are not
        released before the agreed delivery and payment conditions are satisfied. Disputes may be raised through the
        platform and are reviewed by administrators.
      </p>

      <h2>Prohibited conduct</h2>
      <p>
        You must not attempt to bypass account restrictions, access records you are not authorised to see, fabricate
        or misrepresent any government, customs, port or verification status, or use the platform to facilitate the
        movement of prohibited goods.
      </p>

      <h2>Availability and liability</h2>
      <p>
        The platform is provided on an as-available basis. PortBackhaul is not a party to the transport contract
        between clearing agents and carriers and is not liable for loss, damage, delay or non-performance arising
        from that contract. Nothing in these terms excludes liability that cannot lawfully be excluded.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms and will note the date of the latest revision. For questions, email{" "}
        <a href="mailto:legal@portbackhaul.com">legal@portbackhaul.com</a>.
      </p>
    </LegalPage>
  );
}