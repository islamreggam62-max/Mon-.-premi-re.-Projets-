"use client";

import { useEffect, useState } from "react";
import { CAMPAIGN_KEY, campaignFrom, salesMailto } from "@/lib/site";

/**
 * A "request this plan" email link that also names the campaign that brought
 * the visitor (`?src=` or `?utm_source=`), so each email shows which ad or post
 * it came from. The campaign label is kept for the visit only (sessionStorage);
 * no cookie, no tracker, nothing sent until the visitor sends their own email.
 * The first render uses the plain link, so server and client HTML match.
 */
export function SalesEmailLink({
  plan,
  className,
  children,
  testId,
}: {
  plan?: string;
  className?: string;
  children: React.ReactNode;
  testId?: string;
}) {
  const [href, setHref] = useState(() => salesMailto(plan));

  useEffect(() => {
    let source = campaignFrom(window.location.search);
    try {
      if (source) window.sessionStorage.setItem(CAMPAIGN_KEY, source);
      else source = campaignFrom(`?src=${window.sessionStorage.getItem(CAMPAIGN_KEY) ?? ""}`);
    } catch {
      /* storage blocked: the link still works without the campaign label */
    }
    if (source) setHref(salesMailto(plan, source));
  }, [plan]);

  return (
    <a href={href} className={className} data-testid={testId}>
      {children}
    </a>
  );
}
