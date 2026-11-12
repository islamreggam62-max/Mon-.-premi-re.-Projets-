import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { ContractFields } from "@/components/ContractFields";
import { Banner, Empty, EvidenceBlock, LEGAL_NOTICE, Pill, RiskLevelBadge, Section, SeverityBadge, StatusBadge, SubmitRow } from "@/components/ui";
import {
  addObligation, addRisk, applyExtractedTerms, decideReview, requestReview, setContractStatus,
  updateContract, updateObligation, updateRiskStatus, uploadDocument,
} from "@/lib/actions";
import { RISK_CATEGORIES, OBLIGATION_CATEGORIES } from "@/lib/ai/schema";
import { getContext, getMembers, memberName } from "@/lib/context";
import { analysisConfigured } from "@/lib/env";
import { describeDue, formatBytes, formatDate, formatDateTime, formatMoney, humanize, todayIso } from "@/lib/format";
import {
  REVIEWER_ROLES, type Analysis, type Contract, type DocumentRow, type Fact, type Obligation, type Party,
  type Review, type Risk, type Severity,
} from "@/lib/types";

export const metadata: Metadata = { title: "Contract" };

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const IN_PROGRESS = ["queued", "extracting", "analyzing"];
const STALE_AFTER_MS = 15 * 60 * 1000;
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id: rawId }, query] = await Promise.all([params, searchParams]);
  const id = z.uuid().safeParse(rawId);
  if (!id.success) notFound();
  const context = await getContext();
  const db = context.supabase;

  const { data: contractRow } = await db.from("contracts").select("*").eq("id", id.data).eq("org_id", context.org.id).maybeSingle();
  if (!contractRow) notFound();
  const contract = contractRow as Contract;

  const [members, documents, analyses, parties, facts, risks, obligations, reviews] = await Promise.all([
    getMembers(context),
    db.from("documents").select("id, contract_id, filename, mime_type, size_bytes, page_count, uploaded_by, created_at").eq("contract_id", contract.id).order("created_at", { ascending: false }),
    db.from("analyses").select("id, contract_id, document_id, status, model, prompt_version, summary, error, created_at, finished_at").eq("contract_id", contract.id).order("created_at", { ascending: false }).limit(5),
    db.from("contract_parties").select("*").eq("contract_id", contract.id).eq("superseded", false).order("created_at"),
    db.from("contract_facts").select("*").eq("contract_id", contract.id).eq("superseded", false).order("created_at"),
    db.from("risks").select("*").eq("contract_id", contract.id).eq("superseded", false).order("created_at"),
    db.from("obligations").select("*").eq("contract_id", contract.id).eq("superseded", false).order("due_date", { nullsFirst: false }),
    db.from("reviews").select("*").eq("contract_id", contract.id).order("created_at", { ascending: false }),
  ]);

  const documentRows = (documents.data ?? []) as DocumentRow[];
  const analysisRows = (analyses.data ?? []) as Analysis[];
  const partyRows = (parties.data ?? []) as Party[];
  const factRows = (facts.data ?? []) as Fact[];
  const riskRows = ((risks.data ?? []) as Risk[]).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const obligationRows = (obligations.data ?? []) as Obligation[];
  const reviewRows = (reviews.data ?? []) as Review[];

  const latestDocument = documentRows[0];
  const latestAnalysis = analysisRows[0];
  const lastCompleted = analysisRows.find((analysis) => analysis.status === "completed");
  const running =
    latestAnalysis !== undefined &&
    IN_PROGRESS.includes(latestAnalysis.status) &&
    Date.now() - new Date(latestAnalysis.created_at).getTime() < STALE_AFTER_MS;
  const analysedDocument = documentRows.find((document) => document.id === lastCompleted?.document_id);
  const approximatePages = analysedDocument?.mime_type === DOCX;
  const pendingReview = reviewRows.find((review) => review.status === "pending");
  const reviewers = members.filter((member) => REVIEWER_ROLES.includes(member.role) && member.user_id !== context.user.id);
  const canTriage = context.canManage || context.role === "reviewer";
  const today = todayIso();
  const path = `/app/contracts/${contract.id}`;
  const aiFindings = [...partyRows, ...factRows, ...riskRows.filter((risk) => risk.source === "ai" && risk.evidence_kind === "quote"), ...obligationRows.filter((obligation) => obligation.source === "ai")];
  const unverified = aiFindings.filter((finding) => !finding.evidence_verified).length;
  const hasVerifiedTerms = factRows.some((fact) => fact.evidence_verified && fact.field !== "other");

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm"><Link href="/app/contracts" className="text-brand underline">Contracts</Link></nav>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{contract.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {[contract.counterparty ? `with ${contract.counterparty}` : null, contract.contract_type].filter(Boolean).join(" · ") || "No counterparty recorded"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2"><StatusBadge status={contract.status} /><RiskLevelBadge level={contract.risk_level} score={contract.risk_score} /></div>
      </div>
      <Banner searchParams={query} />

      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Expires", contract.expiration_date ? `${formatDate(contract.expiration_date)} (${describeDue(contract.expiration_date, today)})` : "—"],
          ["Give notice by", contract.notice_deadline ? `${formatDate(contract.notice_deadline)} (${describeDue(contract.notice_deadline, today)})` : "—"],
          ["Value", formatMoney(contract.total_value, contract.currency)],
          ["Owner", memberName(members, contract.owner_id)],
        ].map(([label, value]) => (
          <div key={label} className="card p-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</dt>
            <dd className="mt-1 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <Section id="documents" title="Document and analysis">
        {documentRows.length === 0 ? (
          <Empty>No document uploaded yet.</Empty>
        ) : (
          <ul className="mb-4 divide-y divide-slate-100">
            {documentRows.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium">{document.filename}</span>
                  <span className="block text-xs text-ink-muted">
                    {formatBytes(document.size_bytes)}
                    {document.page_count ? ` · ${document.page_count} ${document.mime_type === DOCX ? "sections" : "pages"}` : ""} · uploaded {formatDate(document.created_at)} by {memberName(members, document.uploaded_by)}
                  </span>
                </span>
                <a href={`/app/documents/${document.id}/download`} className="btn-secondary min-h-0 px-3 py-1">Download</a>
              </li>
            ))}
          </ul>
        )}
        {context.canManage ? (
          <form action={uploadDocument} className="mb-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="contract_id" value={contract.id} />
            <div className="min-w-[14rem] flex-1">
              <label htmlFor="file" className="label">{documentRows.length ? "Upload a new version" : "Upload the contract"} (PDF or .docx, up to 25 MB)</label>
              <input id="file" name="file" type="file" required accept=".pdf,.docx" className="input" />
            </div>
            <button type="submit" className="btn-secondary">Upload</button>
          </form>
        ) : null}

        {latestDocument && context.canManage ? (
          analysisConfigured() ? (
            <AnalyzeButton contractId={contract.id} documentId={latestDocument.id} running={running}
              label={lastCompleted ? "Analyse the latest document again" : "Analyse with AI"} />
          ) : (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">AI analysis is not set up on this installation yet (missing server keys).</p>
          )
        ) : null}
        {running && !context.canManage ? <p role="status" className="text-sm text-ink-soft">An analysis is running. Reload the page in a few minutes.</p> : null}
        {latestAnalysis?.status === "failed" ? (
          <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            The last analysis ({formatDateTime(latestAnalysis.created_at)}) did not complete: {latestAnalysis.error ?? "unknown error"}
          </p>
        ) : null}

        {lastCompleted ? (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold">Summary</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-ink-soft" dir="auto">{lastCompleted.summary}</p>
            <p className="mt-2 text-xs text-ink-muted">
              Analysed {formatDateTime(lastCompleted.finished_at)} from “{analysedDocument?.filename ?? "a document no longer listed"}”
              {lastCompleted.model ? ` · model ${lastCompleted.model}` : ""}. {aiFindings.length - unverified} of {aiFindings.length} quotations were found in the document
              {unverified > 0 ? `; ${unverified} could not be found and are marked below.` : "."}
            </p>
            {approximatePages ? <p className="mt-1 text-xs text-ink-muted">Word files have no fixed pages: locations are given as section numbers, in reading order.</p> : null}
            <p className="mt-2 text-xs text-ink-muted">{LEGAL_NOTICE}</p>
          </div>
        ) : null}
      </Section>

      <Section id="risks" title={`Risks (${riskRows.length})`}>
        {riskRows.length === 0 ? <Empty>No risk recorded. Run an analysis or add a risk by hand.</Empty> : (
          <ul className="space-y-4">
            {riskRows.map((risk) => (
              <li key={risk.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={risk.severity} />
                  <Pill className="bg-white text-ink-soft ring-slate-200">{humanize(risk.category)}</Pill>
                  <Pill className="bg-white text-ink-soft ring-slate-200">{risk.source === "ai" ? "AI finding" : "Added by hand"}</Pill>
                  {risk.status !== "open" ? <Pill className="bg-slate-100 text-slate-700 ring-slate-200">{humanize(risk.status)}</Pill> : null}
                </div>
                <h3 className="mt-2 font-semibold" dir="auto">{risk.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-soft" dir="auto">{risk.explanation}</p>
                {risk.recommendation ? <p className="mt-1 text-sm" dir="auto"><strong className="font-semibold">Suggested action:</strong> {risk.recommendation}</p> : null}
                {risk.source === "ai" ? <EvidenceBlock evidence={risk} approximatePages={approximatePages} absence={risk.evidence_kind === "absence"} /> : risk.clause_ref ? <p className="mt-1 text-xs text-ink-muted">Clause: {risk.clause_ref}</p> : null}
                {risk.resolution_note ? <p className="mt-2 text-sm text-ink-soft"><strong className="font-semibold">Note:</strong> {risk.resolution_note}</p> : null}
                {canTriage ? (
                  <form action={updateRiskStatus} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="risk_id" value={risk.id} />
                    <input type="hidden" name="back" value={path} />
                    <div>
                      <label htmlFor={`risk-status-${risk.id}`} className="label">Decision</label>
                      <select id={`risk-status-${risk.id}`} name="status" defaultValue={risk.status} className="input">
                        <option value="open">Open</option>
                        <option value="accepted">Accepted (risk remains)</option>
                        <option value="mitigated">Mitigated</option>
                        <option value="dismissed">Dismissed (not a risk)</option>
                      </select>
                    </div>
                    <div className="min-w-[12rem] flex-1">
                      <label htmlFor={`risk-note-${risk.id}`} className="label">Note</label>
                      <input id={`risk-note-${risk.id}`} name="resolution_note" maxLength={2000} defaultValue={risk.resolution_note ?? ""} className="input" />
                    </div>
                    <button type="submit" className="btn-secondary">Save</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canTriage ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand">Add a risk by hand</summary>
            <form action={addRisk} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="contract_id" value={contract.id} />
              <div className="sm:col-span-2"><label htmlFor="risk-title" className="label">Title</label><input id="risk-title" name="title" required maxLength={300} className="input" /></div>
              <div>
                <label htmlFor="risk-severity" className="label">Severity</label>
                <select id="risk-severity" name="severity" defaultValue="medium" className="input">
                  <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div>
                <label htmlFor="risk-category" className="label">Category</label>
                <select id="risk-category" name="category" defaultValue="other" className="input">
                  {RISK_CATEGORIES.map((category) => <option key={category} value={category}>{humanize(category)}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label htmlFor="risk-explanation" className="label">Explanation</label><textarea id="risk-explanation" name="explanation" required rows={3} maxLength={4000} className="input" /></div>
              <div><label htmlFor="risk-clause" className="label">Clause reference</label><input id="risk-clause" name="clause_ref" maxLength={200} className="input" /></div>
              <div><label htmlFor="risk-recommendation" className="label">Suggested action</label><input id="risk-recommendation" name="recommendation" maxLength={4000} className="input" /></div>
              <div className="sm:col-span-2"><button type="submit" className="btn-secondary">Add risk</button></div>
            </form>
          </details>
        ) : null}
      </Section>

      <Section id="obligations" title={`Obligations (${obligationRows.length})`}>
        {obligationRows.length === 0 ? <Empty>No obligation recorded.</Empty> : (
          <ul className="space-y-4">
            {obligationRows.map((obligation) => {
              const overdue = obligation.due_date !== null && obligation.due_date < today && ["open", "in_progress"].includes(obligation.status);
              const mayUpdate = context.canManage || obligation.assignee_id === context.user.id;
              return (
                <li key={obligation.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill className="bg-white text-ink-soft ring-slate-200">{humanize(obligation.category)}</Pill>
                    <Pill className={obligation.status === "done" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"}>{humanize(obligation.status)}</Pill>
                    {overdue ? <Pill className="bg-red-100 text-red-800 ring-red-200">Overdue</Pill> : null}
                  </div>
                  <p className="mt-2 text-sm font-medium" dir="auto">{obligation.description}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {[obligation.responsible_party ? `Responsible: ${obligation.responsible_party}` : null,
                      obligation.due_date ? `Due ${formatDate(obligation.due_date)} (${describeDue(obligation.due_date, today)})` : "No fixed date",
                      obligation.recurrence, `Assigned to ${memberName(members, obligation.assignee_id)}`].filter(Boolean).join(" · ")}
                  </p>
                  {obligation.source === "ai" ? <EvidenceBlock evidence={obligation} approximatePages={approximatePages} /> : null}
                  {mayUpdate ? (
                    <form action={updateObligation} className="mt-3 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="obligation_id" value={obligation.id} />
                      <input type="hidden" name="back" value={path} />
                      <div>
                        <label htmlFor={`ob-status-${obligation.id}`} className="label">Status</label>
                        <select id={`ob-status-${obligation.id}`} name="status" defaultValue={obligation.status} className="input">
                          <option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="waived">Waived</option>
                        </select>
                      </div>
                      {context.canManage ? (
                        <>
                          <div>
                            <label htmlFor={`ob-assignee-${obligation.id}`} className="label">Assignee</label>
                            <select id={`ob-assignee-${obligation.id}`} name="assignee_id" defaultValue={obligation.assignee_id ?? ""} className="input">
                              <option value="">Unassigned</option>
                              {members.map((member) => <option key={member.user_id} value={member.user_id}>{member.full_name ?? member.email}</option>)}
                            </select>
                          </div>
                          <div>
                            <label htmlFor={`ob-due-${obligation.id}`} className="label">Due date</label>
                            <input id={`ob-due-${obligation.id}`} name="due_date" type="date" defaultValue={obligation.due_date ?? ""} className="input" />
                          </div>
                        </>
                      ) : null}
                      <button type="submit" className="btn-secondary">Save</button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        {context.canManage ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-brand">Add an obligation by hand</summary>
            <form action={addObligation} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="contract_id" value={contract.id} />
              <div className="sm:col-span-2"><label htmlFor="ob-description" className="label">What must be done</label><textarea id="ob-description" name="description" required rows={2} maxLength={2000} className="input" /></div>
              <div><label htmlFor="ob-party" className="label">Responsible party</label><input id="ob-party" name="responsible_party" maxLength={300} className="input" /></div>
              <div>
                <label htmlFor="ob-category" className="label">Category</label>
                <select id="ob-category" name="category" defaultValue="other" className="input">
                  {OBLIGATION_CATEGORIES.map((category) => <option key={category} value={category}>{humanize(category)}</option>)}
                </select>
              </div>
              <div><label htmlFor="ob-due" className="label">Due date</label><input id="ob-due" name="due_date" type="date" className="input" /></div>
              <div><label htmlFor="ob-recurrence" className="label">Recurrence</label><input id="ob-recurrence" name="recurrence" maxLength={300} placeholder="e.g. monthly" className="input" /></div>
              <div><label htmlFor="ob-clause" className="label">Clause reference</label><input id="ob-clause" name="clause_ref" maxLength={200} className="input" /></div>
              <div>
                <label htmlFor="ob-assignee" className="label">Assignee</label>
                <select id="ob-assignee" name="assignee_id" defaultValue="" className="input">
                  <option value="">Unassigned</option>
                  {members.map((member) => <option key={member.user_id} value={member.user_id}>{member.full_name ?? member.email}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><button type="submit" className="btn-secondary">Add obligation</button></div>
            </form>
          </details>
        ) : null}
      </Section>

      <Section id="terms" title="Parties and key terms found in the document"
        aside={context.canManage && hasVerifiedTerms ? (
          <form action={applyExtractedTerms}><input type="hidden" name="contract_id" value={contract.id} />
            <button type="submit" className="btn-secondary min-h-0 px-3 py-1">Copy verified terms to the record</button></form>
        ) : undefined}>
        {partyRows.length === 0 && factRows.length === 0 ? <Empty>Nothing extracted yet. Run an analysis to fill this section.</Empty> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Parties</h3>
              <ul className="space-y-3">
                {partyRows.map((party) => (
                  <li key={party.id}>
                    <span className="text-sm font-medium" dir="auto">{party.name}</span>{party.role ? <span className="text-sm text-ink-muted"> · {party.role}</span> : null}
                    <EvidenceBlock evidence={party} approximatePages={approximatePages} />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Key terms</h3>
              <ul className="space-y-3">
                {factRows.map((fact) => (
                  <li key={fact.id}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{fact.label}</span>
                    <span className="block text-sm font-medium" dir="auto">{fact.value_text}</span>
                    <EvidenceBlock evidence={fact} approximatePages={approximatePages} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-muted">Extracted terms never change the contract record by themselves. Copying them is your decision, and only terms whose quotation was found are copied.</p>
      </Section>

      <Section id="review" title="Review and approval">
        {pendingReview ? (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
            <p>Waiting for <strong>{memberName(members, pendingReview.reviewer_id)}</strong> since {formatDate(pendingReview.created_at)} (requested by {memberName(members, pendingReview.requested_by)}).</p>
            {pendingReview.reviewer_id === context.user.id ? (
              <form action={decideReview} className="mt-3 space-y-2">
                <input type="hidden" name="review_id" value={pendingReview.id} />
                <input type="hidden" name="back" value={path} />
                <label htmlFor="review-comment" className="label">Comment (required to reject or request changes)</label>
                <textarea id="review-comment" name="comment" rows={2} maxLength={4000} className="input" />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" name="decision" value="approved" className="btn-primary">Approve</button>
                  <button type="submit" name="decision" value="changes_requested" className="btn-secondary">Request changes</button>
                  <button type="submit" name="decision" value="rejected" className="btn-danger">Reject</button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
        {context.canManage && contract.status === "draft" ? (
          reviewers.length === 0 ? (
            <p className="mb-4 text-sm text-ink-soft">No colleague can review yet. Invite a reviewer or an administrator from the <Link href="/app/team" className="text-brand underline">Team</Link> page: approval must come from someone other than you.</p>
          ) : (
            <form action={requestReview} className="mb-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="contract_id" value={contract.id} />
              <div>
                <label htmlFor="reviewer_id" className="label">Send for review to</label>
                <select id="reviewer_id" name="reviewer_id" required className="input">
                  {reviewers.map((member) => <option key={member.user_id} value={member.user_id}>{member.full_name ?? member.email} ({humanize(member.role)})</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary">Request review</button>
            </form>
          )
        ) : null}
        {context.canManage && ["approved", "active", "expired", "terminated"].includes(contract.status) ? (
          <form action={setContractStatus} className="mb-4 flex flex-wrap gap-2">
            <input type="hidden" name="contract_id" value={contract.id} />
            {contract.status === "approved" ? <button type="submit" name="status" value="active" className="btn-primary">Mark as active (signed and in force)</button> : null}
            {["approved", "active"].includes(contract.status) ? (
              <>
                <button type="submit" name="status" value="expired" className="btn-secondary">Mark as expired</button>
                <button type="submit" name="status" value="terminated" className="btn-secondary">Mark as terminated</button>
              </>
            ) : null}
            {["expired", "terminated"].includes(contract.status) ? <button type="submit" name="status" value="draft" className="btn-secondary">Reopen as draft</button> : null}
          </form>
        ) : null}
        {reviewRows.length === 0 ? <Empty>No review has been requested for this contract.</Empty> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {reviewRows.map((review) => (
              <li key={review.id} className="py-2">
                <span className="font-medium">{humanize(review.status)}</span> · reviewer {memberName(members, review.reviewer_id)} · requested {formatDate(review.created_at)} by {memberName(members, review.requested_by)}
                {review.decided_at ? ` · decided ${formatDate(review.decided_at)}` : ""}
                {review.comment ? <span className="block text-ink-soft" dir="auto">“{review.comment}”</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="record" title="Contract record">
        <form action={updateContract}>
          <input type="hidden" name="contract_id" value={contract.id} />
          <ContractFields contract={contract} members={members} disabled={!context.canManage} />
          {context.canManage ? <SubmitRow label="Save record" /> : <p className="mt-3 text-xs text-ink-muted">Your role can read this record but not change it.</p>}
        </form>
      </Section>
    </>
  );
}
