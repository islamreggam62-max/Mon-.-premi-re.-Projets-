// Stand-in for Supabase used ONLY by the render smoke test.
// It answers the app's read queries with fixed rows so every page can be rendered
// and looked at. It checks nothing about permissions or data: the database rules
// are tested for real in supabase/tests. Never use this for anything else.
import { createServer } from "node:http";

const ORG = "11111111-1111-4111-8111-111111111111";
const ME = "22222222-2222-4222-8222-222222222222";
const COLLEAGUE = "33333333-3333-4333-8333-333333333333";
const CONTRACT = "44444444-4444-4444-8444-444444444444";
const DOCUMENT = "55555555-5555-4555-8555-555555555555";
const ANALYSIS = "66666666-6666-4666-8666-666666666666";
const day = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const evidence = (page, clause, quote, verified = true) => ({ page_number: page, clause_ref: clause, quote, evidence_verified: verified, superseded: false });
const base = { org_id: ORG, contract_id: CONTRACT, created_at: new Date().toISOString() };

export const USER = { id: ME, aud: "authenticated", role: "authenticated", email: "amina@example.test", user_metadata: { full_name: "Amina Example" }, app_metadata: {} };

const TABLES = {
  memberships: [
    { org_id: ORG, user_id: ME, role: "owner", created_at: "2026-10-01T09:00:00Z", organizations: { name: "Example Trading Co" } },
    { org_id: ORG, user_id: COLLEAGUE, role: "manager", created_at: "2026-10-02T09:00:00Z", organizations: { name: "Example Trading Co" } },
  ],
  profiles: [
    { id: ME, email: "amina@example.test", full_name: "Amina Example" },
    { id: COLLEAGUE, email: "karim@example.test", full_name: "Karim Sample" },
  ],
  contracts: [{
    id: CONTRACT, org_id: ORG, title: "Master supply agreement 2026", counterparty: "Northwind Supplies Ltd", our_party: "the Buyer",
    contract_type: "Supply", description: null, status: "in_review", effective_date: "2026-01-01", expiration_date: day(120),
    auto_renews: true, renewal_term_months: 12, notice_period_days: 90, notice_deadline: day(30), total_value: 1250000, currency: "USD",
    governing_law: "England and Wales", owner_id: ME, risk_score: 68, risk_level: "critical", created_by: COLLEAGUE,
    created_at: "2026-10-05T10:00:00Z", updated_at: "2026-11-01T10:00:00Z",
  }],
  documents: [{ id: DOCUMENT, org_id: ORG, contract_id: CONTRACT, storage_path: `${ORG}/${CONTRACT}/${DOCUMENT}.pdf`, filename: "northwind-msa-signed.pdf", mime_type: "application/pdf", size_bytes: 482113, page_count: 24, uploaded_by: COLLEAGUE, created_at: "2026-10-05T10:01:00Z" }],
  analyses: [{ id: ANALYSIS, contract_id: CONTRACT, document_id: DOCUMENT, status: "completed", model: "claude-opus-5-5", prompt_version: "contract-analysis/2026-11-12.1", summary: "Twelve-month supply agreement under which Northwind supplies packaging materials to the Buyer. It renews automatically unless notice is given 90 days before expiry. The Buyer's main exposure is an uncapped indemnity and a unilateral price revision right for the Supplier.", error: null, created_at: "2026-11-01T10:00:00Z", finished_at: "2026-11-01T10:02:10Z" }],
  contract_parties: [
    { id: "a1", ...base, name: "Northwind Supplies Ltd", role: "Supplier", ...evidence(1, null, "NORTHWIND SUPPLIES LTD, a company registered in England (the “Supplier”)") },
    { id: "a2", ...base, name: "Example Trading Co", role: "Buyer", ...evidence(1, null, "EXAMPLE TRADING CO (the “Buyer”)") },
  ],
  contract_facts: [
    { id: "f1", ...base, field: "expiration_date", label: "Expiration date", value_text: "31 December 2026", value_date: "2026-12-31", value_number: null, currency: null, ...evidence(3, "Clause 2.1", "This Agreement shall continue until 31 December 2026") },
    { id: "f2", ...base, field: "notice_period_days", label: "Notice period", value_text: "90 days before the end of the term", value_date: null, value_number: 90, currency: null, ...evidence(3, "Clause 2.2", "unless either party gives not less than ninety (90) days’ written notice") },
    { id: "f3", ...base, field: "liability_cap", label: "Liability cap", value_text: "Fees paid in the preceding 12 months (Supplier only)", value_date: null, value_number: null, currency: null, ...evidence(14, "Clause 11.2", "the Supplier’s total liability shall not exceed the Charges paid", false) },
  ],
  risks: [
    { id: "r1", ...base, analysis_id: ANALYSIS, source: "ai", evidence_kind: "quote", category: "indemnification", severity: "critical", title: "Uncapped indemnity given by the Buyer", explanation: "The Buyer indemnifies the Supplier against all third-party claims with no financial limit, while the Supplier's own liability is capped.", recommendation: "Negotiate a mutual cap or exclude the indemnity from unlimited liability.", status: "open", resolution_note: null, ...evidence(15, "Clause 12.1", "The Buyer shall indemnify the Supplier against all losses, without limit, arising from any third party claim") },
    { id: "r2", ...base, analysis_id: ANALYSIS, source: "ai", evidence_kind: "quote", category: "payment", severity: "high", title: "Supplier may revise prices unilaterally", explanation: "Prices can be increased on 30 days' notice with no ceiling and no right for the Buyer to terminate.", recommendation: "Add a cap tied to an index and a termination right.", status: "accepted", resolution_note: "Accepted for 2026 by procurement.", ...evidence(8, "Clause 6.4", "The Supplier may revise the Charges on thirty (30) days’ notice", false) },
    { id: "r3", ...base, analysis_id: ANALYSIS, source: "ai", evidence_kind: "absence", category: "force_majeure", severity: "medium", title: "No force majeure clause", explanation: "The agreement does not excuse either party for events outside its control.", recommendation: "Add a balanced force majeure clause with a termination right after a prolonged event.", status: "open", resolution_note: null, page_number: null, clause_ref: null, quote: null, evidence_verified: false, superseded: false },
    { id: "r4", ...base, analysis_id: null, source: "manual", evidence_kind: "quote", category: "compliance", severity: "low", title: "Supplier certificate not yet received", explanation: "ISO certificate referred to in schedule 2 is missing from the file.", recommendation: null, status: "open", resolution_note: null, page_number: null, clause_ref: "Schedule 2", quote: null, evidence_verified: false, superseded: false },
  ],
  obligations: [
    { id: "o1", ...base, source: "ai", responsible_party: "Buyer", category: "payment", description: "Pay each undisputed invoice within 30 days of receipt.", due_date: null, recurrence: "each invoice", status: "open", assignee_id: COLLEAGUE, contracts: { title: "Master supply agreement 2026" }, ...evidence(8, "Clause 6.2", "The Buyer shall pay each invoice within thirty (30) days of receipt") },
    { id: "o2", ...base, source: "ai", responsible_party: "Buyer", category: "reporting", description: "Provide a rolling 3-month purchase forecast.", due_date: day(-6), recurrence: "monthly", status: "open", assignee_id: ME, contracts: { title: "Master supply agreement 2026" }, ...evidence(5, "Clause 4.1", "the Buyer shall provide a rolling three-month forecast") },
  ],
  reviews: [{ id: "77777777-7777-4777-8777-777777777777", org_id: ORG, contract_id: CONTRACT, requested_by: COLLEAGUE, reviewer_id: ME, status: "pending", comment: null, created_at: "2026-11-10T08:00:00Z", decided_at: null, contracts: { title: "Master supply agreement 2026" } }],
  deadlines: [
    { org_id: ORG, contract_id: CONTRACT, contract_title: "Master supply agreement 2026", kind: "obligation", label: "Provide a rolling 3-month purchase forecast.", due_date: day(-6), obligation_id: "o2" },
    { org_id: ORG, contract_id: CONTRACT, contract_title: "Master supply agreement 2026", kind: "notice", label: "Last day to give notice before automatic renewal", due_date: day(30), obligation_id: null },
    { org_id: ORG, contract_id: CONTRACT, contract_title: "Master supply agreement 2026", kind: "expiration", label: "Contract expires", due_date: day(120), obligation_id: null },
  ],
  invitations: [{ id: "88888888-8888-4888-8888-888888888888", email: "new.colleague@example.test", role: "reviewer", expires_at: new Date(Date.now() + 5 * 86_400_000).toISOString(), created_at: new Date().toISOString() }],
  subscriptions: [{ org_id: ORG, plan: "trial", status: "trialing", seat_limit: 3, contract_limit: 10, monthly_analysis_limit: 20, current_period_end: new Date(Date.now() + 9 * 86_400_000).toISOString() }],
  audit_log: [
    { id: 3, actor_id: ME, action: "risk.updated", entity_type: "risk", metadata: { changed: ["status"], status_from: "open", status_to: "accepted" }, created_at: "2026-11-11T09:30:00Z" },
    { id: 2, actor_id: null, action: "analysis.updated", entity_type: "analysis", metadata: { changed: ["status"], status_from: "analyzing", status_to: "completed" }, created_at: "2026-11-01T10:02:10Z" },
    { id: 1, actor_id: COLLEAGUE, action: "contract.created", entity_type: "contract", metadata: {}, created_at: "2026-10-05T10:00:00Z" },
  ],
};

export const IDS = { CONTRACT };

export function startFakeSupabase(port) {
  const server = createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const send = (status, body, headers = {}) => {
      response.writeHead(status, { "content-type": "application/json", ...headers });
      response.end(body === undefined ? "" : JSON.stringify(body));
    };
    if (url.pathname === "/auth/v1/user") return send(200, USER);
    if (url.pathname.startsWith("/rest/v1/")) {
      let rows = TABLES[url.pathname.slice("/rest/v1/".length)] ?? [];
      const idFilter = url.searchParams.get("id");
      if (idFilter?.startsWith("eq.")) rows = rows.filter((row) => String(row.id) === idFilter.slice(3));
      const range = { "content-range": rows.length ? `0-${rows.length - 1}/${rows.length}` : "*/0" };
      if (request.method === "HEAD") return send(200, undefined, range);
      if ((request.headers.accept ?? "").includes("vnd.pgrst.object")) {
        return rows.length === 1 ? send(200, rows[0], range) : send(406, { code: "PGRST116", message: "no single row", details: `${rows.length} rows` });
      }
      return send(200, rows, range);
    }
    send(404, { message: "not part of the smoke fixture" });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
