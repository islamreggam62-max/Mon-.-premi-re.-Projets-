import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/LegalPage";
import { CURRENCY, PLANS } from "@/lib/data/pricing";
import { CONTACT_EMAIL } from "@/lib/site";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the NEXORA website and app during early access.",
};

/**
 * Terms for the website and the free early-access app only. Paid subscriptions
 * need their own terms of sale, published before checkout opens.
 */
export default function TermsPage() {
  const plans = PLANS.map((p) => `${p.name}, ${formatCurrency(p.price)} per ${p.interval}`).join("; ");
  return (
    <LegalPage
      title="Terms of Use"
      intro="These terms apply to the NEXORA website and app. By using them, you accept these terms."
    >
      <LegalSection title="1. About NEXORA">
        <p>
          NEXORA is an executive business operating system in early access. This website presents the product, and the
          app can be used free of charge during early access, with a sample company or with your own company&apos;s data.
        </p>
      </LegalSection>

      <LegalSection title="2. The app and your data">
        <p>
          What you enter is saved only on your device, in your browser or in the Android app. We do not receive it,
          cannot recover it, and do not back it up: keep your own backups from Settings. Clearing the browser&apos;s
          site data or uninstalling the app erases it. The sample company is fictional. The AI Intelligence module is a
          preview made of static examples; it does not analyze any data.
        </p>
      </LegalSection>

      <LegalSection title="3. Plans and prices">
        <p>
          The plans shown ({plans}; prices in {CURRENCY}) are the list prices planned for launch. No subscription can be
          purchased on this site yet. When checkout opens, subscriptions will be governed by terms of sale published at
          that time, which you will be able to read before paying.
        </p>
        {CONTACT_EMAIL && (
          <p>
            You can already request a plan by email at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A request
            is not a purchase: no payment is due until you have received and accepted the terms of sale.
          </p>
        )}
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>
          Do not attempt to disrupt the site, access it in a way that places an unreasonable load on it, or use it for
          any unlawful purpose.
        </p>
      </LegalSection>

      <LegalSection title="5. Intellectual property">
        <p>
          The NEXORA name, logo, design, and software are protected and remain the property of their owner. All rights
          reserved. Using the app gives you no right in the software beyond using it during early access. The data you
          enter remains yours.
        </p>
      </LegalSection>

      <LegalSection title="6. No warranty">
        <p>
          The website and app are provided “as is” and “as available”, without warranty of any kind, to the extent
          permitted by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="7. Liability">
        <p>
          To the extent permitted by applicable law, NEXORA is not liable for any loss arising from the use of the
          website or the app, which are free of charge during early access, including the loss of data kept on your
          device.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes">
        <p>These terms may be updated. The date above shows when they last changed.</p>
      </LegalSection>

      {CONTACT_EMAIL && (
        <LegalSection title="9. Contact">
          <p>
            Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </LegalSection>
      )}
    </LegalPage>
  );
}
