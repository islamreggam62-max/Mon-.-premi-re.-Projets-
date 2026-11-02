import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What the NEXORA website and live demo do with your data: no accounts, no cookies, no tracking.",
};

const onGitHubPages = process.env.NEXT_PUBLIC_HOSTING === "github-pages";

/**
 * Describes the site exactly as built today (static demo, no backend). Update
 * it, and LEGAL_UPDATED, before any feature collects personal data.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what happens to your data when you visit the NEXORA website and live demo. NEXORA is in early access: this site has no accounts, no payments, and no forms."
    >
      <LegalSection title="1. What we collect">
        <p>
          The site itself collects nothing. It has no sign-up, no contact form, no analytics, and no advertising
          trackers, and it sets no cookies.
        </p>
        {CONTACT_EMAIL && (
          <p>
            If you write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, for example to request a plan, we
            receive your email address and what you write. We use them only to reply to you and handle your request,
            and we do not sell or share them.
          </p>
        )}
      </LegalSection>

      <LegalSection title="2. What stays on your device">
        <ul>
          <li>
            One display preference: whether the sidebar is collapsed, kept in your browser&apos;s local storage under the
            key <code className="text-slate-200">nexora:sidebar-collapsed</code>. It never leaves your device.
          </li>
          <li>
            Copies of the site&apos;s pages and files, stored by your browser (a service worker) so NEXORA opens faster
            and works offline. This cache contains no personal data.
          </li>
          <li>
            Actions in the demo, such as approving a request, change only what you see in that browser tab and reset
            when you reload. Nothing is sent or stored.
          </li>
        </ul>
        <p>To remove all of it, uninstall the app or clear this site&apos;s data in your browser settings.</p>
      </LegalSection>

      <LegalSection title="3. Sample data">
        <p>The people, companies, and figures in the demo are fictional sample data.</p>
      </LegalSection>

      <LegalSection title="4. Hosting">
        {onGitHubPages ? (
          <p>
            The site is hosted on GitHub Pages, a service of GitHub, Inc. GitHub logs visitors&apos; IP addresses for
            security purposes; see{" "}
            <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages" rel="noopener noreferrer">
              GitHub&apos;s documentation
            </a>{" "}
            and its privacy statement.
          </p>
        ) : (
          <p>
            Our hosting provider may process technical information, such as your IP address, to deliver and secure the
            site.
          </p>
        )}
      </LegalSection>

      <LegalSection title="5. Changes">
        <p>
          Accounts, payments, and your own company data will arrive in a later release. This policy will be updated
          before NEXORA collects any personal data, and the date above will change.
        </p>
      </LegalSection>

      {CONTACT_EMAIL && (
        <LegalSection title="6. Contact">
          <p>
            Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </LegalSection>
      )}
    </LegalPage>
  );
}
