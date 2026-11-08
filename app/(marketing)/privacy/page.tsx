import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What NEXORA does with your data: no accounts, no cookies, no tracking, and what you enter stays on your device.",
};

const onGitHubPages = process.env.NEXT_PUBLIC_HOSTING === "github-pages";

/**
 * Describes NEXORA exactly as built today: no backend, data kept on the device.
 * Update it, and LEGAL_UPDATED, before any feature sends personal data anywhere.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what happens to your data when you use the NEXORA website and app. NEXORA is in early access: it has no accounts and no payments, and what you enter in the app stays on your device."
    >
      <LegalSection title="1. What we collect">
        <p>
          We collect nothing through the site or the app. They have no sign-up, no analytics, and no advertising
          trackers, and they set no cookies. We never receive what you enter in NEXORA.
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
            If you arrive through one of our links that names a campaign (for example{" "}
            <code className="text-slate-200">?src=linkedin-ads</code>), that label is kept for your visit only, in your
            browser&apos;s session storage under <code className="text-slate-200">nexora:campaign</code>, and added to the
            subject of an email you choose to send us. It is never sent anywhere on its own.
          </li>
          <li>
            On the website, copies of the site&apos;s pages and files, stored by your browser (a service worker) so
            NEXORA opens faster and works offline. This cache contains no personal data.
          </li>
          <li>
            Your NEXORA data: your company profile and the people, projects, tasks, daily reports, and approvals you
            enter (or the sample company with your changes), kept in your browser&apos;s local storage, or the Android
            app&apos;s storage, under the key <code className="text-slate-200">nexora:data</code>. It can include
            personal data about the people you add, such as names, job titles, email addresses, workload, and reports.
            It is not sent to us or to anyone else.
          </li>
          <li>
            Backups you download or copy from Settings are files or text that you control and keep where you choose.
          </li>
        </ul>
        <p>
          If you record information about other people, such as your employees, you decide what to record and you are
          responsible for doing so under the data protection law that applies to you, including informing them.
        </p>
        <p>
          To remove all of it, use Settings, Your data, Erase all data, or uninstall the app or clear this site&apos;s
          data in your browser settings (in the Android app: Settings, Apps, NEXORA, Storage, Clear storage). This erases
          your NEXORA data for good: back it up first if you want to keep it.
        </p>
      </LegalSection>

      <LegalSection title="3. Sample data">
        <p>The people, companies, and figures in the sample company are fictional.</p>
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

      <LegalSection title="5. The Android app">
        <p>
          The NEXORA Android app contains these same pages and files and opens them from your device. It has no
          account, no analytics, and no advertising, and it sends nothing on its own. Links to our website, and the
          email you may choose to send us, open in your browser or email app. When you share a backup from Settings, the
          app saves the file in its private cache and Android&apos;s share menu sends it only to the app you choose. If
          backup is turned on for your Android device, Android may include the app&apos;s data in your device backup to
          your own Google account.
        </p>
      </LegalSection>

      <LegalSection title="6. Changes">
        <p>
          Accounts, payments, and shared company workspaces will arrive in a later release. This policy will be
          updated before NEXORA sends or collects any personal data, and the date above will change.
        </p>
      </LegalSection>

      {CONTACT_EMAIL && (
        <LegalSection title="7. Contact">
          <p>
            Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </LegalSection>
      )}
    </LegalPage>
  );
}
