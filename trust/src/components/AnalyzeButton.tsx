"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ERRORS: Record<string, string> = {
  not_configured: "AI analysis is not set up on this installation yet.",
  forbidden: "Your role does not allow starting an analysis.",
  already_running: "An analysis of this contract is already running.",
  plan_limit_analyses: "All AI analyses included in your plan this month have been used.",
  not_found: "The document could not be found.",
  contract_locked: "Findings cannot be regenerated while a review is pending.",
  subscription_inactive: "This organisation's subscription is not active.",
  service_busy: "The analysis service has reached its daily capacity. Please try again tomorrow.",
};

/** Starts an analysis, then refreshes the page until it has finished. */
export function AnalyzeButton({ contractId, documentId, running, label }: { contractId: string; documentId: string; running: boolean; label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = pending || running;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [running, router]);

  useEffect(() => {
    if (running) setPending(false);
  }, [running]);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/contracts/${contractId}/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(ERRORS[body.error ?? ""] ?? "The analysis could not be started. Please try again.");
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setError("The analysis could not be started. Check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={start} disabled={busy} aria-busy={busy} className="btn-primary">
        {busy ? "Analysing… this can take a few minutes" : label}
      </button>
      <p role="status" aria-live="polite" className="mt-2 text-sm text-red-700">{error}</p>
    </div>
  );
}
