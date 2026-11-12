# Roadmap

Each phase ends with a gate: the owner approves before the next starts.

## Phase 1 — Core application (this delivery)

Accounts, organisations and roles; contract records and documents; text
extraction; AI analysis with evidence check; risks and obligations; deadlines;
review and approval; audit trail; plan limits; dashboard.

**Gate — still open:**

1. **First real run.** Create a Supabase project, apply the migrations, set the
   keys, and walk through: sign up → organisation → upload → analysis → triage →
   review → approval. This has not been done. Expect small fixes.
2. **Run the database tests against the real project's schema** (in a transaction
   that is rolled back) to confirm the policies behave the same under Supabase's
   own roles and storage schema as under the local stand-in.
3. **Second independent security review.** The first one found a critical flaw and
   several serious ones; they are fixed and tested (see `SECURITY.md`), but the fixes
   have not been re-tested by an independent reviewer.
4. **Owner decisions:** plan names, prices and limits; output language policy;
   hosting provider; data region.

## Phase 2 — Trustworthy analysis

- Evaluation set: synthetic contracts in English, French and Arabic with known
  answers and planted risks, including hostile documents. Scores before any prompt change.
- OCR for scanned PDFs.
- Long documents: split, analyse and merge, with evidence preserved.
- Clause-level view: open the document at the cited page.
- Organisation playbook: the positions an organisation accepts or refuses, so
  findings are judged against its own standards.

## Phase 3 — Operations

- Job queue and worker for analyses; retry and failure alerts.
- Direct-to-storage uploads (removes the request-size limit of some hosts).
- Email: invitations, review requests, deadline reminders with delivery checks.
- Paging and search across lists.
- Interface languages (French, Arabic) with right-to-left layout.

## Phase 4 — Enterprise

- SSO (SAML/OIDC), MFA, session management.
- Payment provider and self-service plans. Check which providers serve the
  customer's country before choosing.
- Data export, retention rules, organisation deletion.
- Malware scanning, rate limiting, penetration test.
- Compliance documentation mapped to the frameworks customers ask for.
