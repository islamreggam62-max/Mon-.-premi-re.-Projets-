import Link from "next/link";
import { MESSAGES } from "@/lib/messages";
import { humanize } from "@/lib/format";
import type { ContractStatus, Evidence, Severity } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

/** Shows the confirmation or error named by ?notice= / ?error=. Unknown codes show nothing. */
export function Banner({ searchParams }: { searchParams: SearchParams }) {
  const code = [searchParams.error, searchParams.notice].find((value): value is string => typeof value === "string");
  const message = code ? MESSAGES[code] : undefined;
  if (!message) return null;
  const isError = message.tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`mb-4 rounded-md border px-4 py-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}
    >
      {message.text}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Section({ id, title, children, aside }: { id?: string; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="card mb-6 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <h2 id={id ? `${id}-title` : undefined} className="text-base font-semibold">{title}</h2>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-ink-muted">{children}</p>;
}

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800 ring-red-200",
  high: "bg-orange-100 text-orange-800 ring-orange-200",
  medium: "bg-amber-100 text-amber-800 ring-amber-200",
  low: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}>{children}</span>;
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Pill className={SEVERITY_STYLE[severity]}>{humanize(severity)}</Pill>;
}

export function RiskLevelBadge({ level, score }: { level: Severity | null; score: number | null }) {
  if (!level) return <Pill className="bg-white text-ink-muted ring-slate-200">Not assessed</Pill>;
  return <Pill className={SEVERITY_STYLE[level]}>{humanize(level)} risk{score !== null ? ` · ${score}` : ""}</Pill>;
}

const STATUS_STYLE: Record<ContractStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  in_review: "bg-blue-100 text-blue-800 ring-blue-200",
  approved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  active: "bg-emerald-600 text-white ring-emerald-700",
  expired: "bg-slate-200 text-slate-600 ring-slate-300",
  terminated: "bg-slate-200 text-slate-600 ring-slate-300",
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  return <Pill className={STATUS_STYLE[status]}>{humanize(status)}</Pill>;
}

/**
 * The source of a finding: where it is in the document and whether the quoted
 * words were found there. For Word files the page number is a section number.
 */
export function EvidenceBlock({ evidence, approximatePages, absence = false }: { evidence: Evidence; approximatePages: boolean; absence?: boolean }) {
  if (absence) {
    return (
      <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-ink-muted">
        <strong className="font-semibold text-ink-soft">No quotation possible.</strong> This finding says something is missing from the
        document, so it cannot be checked against a passage and does not count toward the risk score. Confirm it by reading the contract.
      </p>
    );
  }
  if (!evidence.quote) return null;
  const where = [
    evidence.page_number ? `${approximatePages ? "Section" : "Page"} ${evidence.page_number}` : null,
    evidence.clause_ref,
  ].filter(Boolean).join(" · ");
  return (
    <figure className="mt-2 rounded-md border-l-4 border-slate-300 bg-slate-50 px-3 py-2">
      <blockquote className="text-sm italic text-ink-soft" dir="auto">“{evidence.quote}”</blockquote>
      <figcaption className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        {where ? <span>{where}</span> : null}
        {evidence.evidence_verified ? (
          <Pill className="bg-emerald-50 text-emerald-800 ring-emerald-200">Quotation found in document</Pill>
        ) : (
          <Pill className="bg-red-50 text-red-800 ring-red-200">Quotation not found — treat as unconfirmed</Pill>
        )}
      </figcaption>
    </figure>
  );
}

export function SubmitRow({ label = "Save", cancelHref }: { label?: string; cancelHref?: string }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="submit" className="btn-primary">{label}</button>
      {cancelHref ? <Link href={cancelHref} className="btn-secondary">Cancel</Link> : null}
    </div>
  );
}

export const LEGAL_NOTICE =
  "TRUST supports your review; it does not replace qualified legal counsel. A “found” quotation confirms the words are in the document, not that the interpretation is legally correct.";
