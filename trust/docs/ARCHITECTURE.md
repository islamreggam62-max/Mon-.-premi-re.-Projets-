# Architecture

## Components

```
Browser ──► Next.js (server components, server actions, route handlers)
                │  as the signed-in user (JWT in cookies)
                ▼
            Supabase: Postgres + row-level security · Auth · Storage (private bucket)
                ▲
                │  service role, analysis pipeline only
            Analysis pipeline ──► Claude API
```

- **Next.js 15, App Router.** Pages are server components. The browser runs code
  only for the analysis button (polling) and the invitation form.
- **Supabase.** Postgres holds all data and all access rules. Auth issues the
  session. Storage keeps the contract files in a private bucket.
- **Claude API.** One request per analysis, with a JSON schema for the answer.

## Decisions and their reasons

**1. Access rules live in the database.** Every table has row-level security and
explicit column grants. The application never decides who may see a row; it asks
as the user and the database answers. Reason: one missing `where org_id = …` in
application code would otherwise leak a customer's contracts. Children reference
parents with composite `(id, org_id)` keys, so a row cannot point across tenants
even through a bug.

**2. Two clients, one of them dangerous.** `src/lib/supabase/server.ts` acts as the
user. `src/lib/supabase/admin.ts` uses the service role, which bypasses the rules.
It is imported in exactly one place: the analysis pipeline, after the request has
been authorised by inserting the `analyses` row as the user.

**3. Users cannot write AI results.** Findings and the `evidence_verified` flag are
written only by `store_analysis_results`, callable only by the service role. Users
get column-level `UPDATE` on status fields and nothing else. Reason: the value of
the product is that a "verified" mark can be believed.

**4. The model's answer is untrusted input.** The pipeline validates it against the
schema, looks every quotation up in the text we extracted ourselves, corrects page
numbers, validates dates and numbers, and bounds every string. See
`src/lib/ai/payload.ts` and `src/lib/ai/evidence.ts`.

**5. The risk score is arithmetic, not opinion.** `private.recompute_contract_risk`
adds fixed weights (critical 40, high 20, medium 8, low 2, capped at 100) over open
and accepted risks that are either manual or AI findings with a located quotation.
"Absence" findings (something missing from the document) and unconfirmed findings
never move the score. Levels: 60+ critical, 30+ high, 10+ medium, else low.
These weights are a starting point and should be reviewed with users.

**6. Workflow through functions.** Membership, review and contract status change
only through `SECURITY DEFINER` functions that check the caller's role. Approval
needs a named reviewer who is not the requester; the record and its documents are
frozen while the review is pending.

**7. Extracted terms never overwrite the record.** The analysis stores what it
found. A person copies verified terms into the contract record with one action.

**8. The audit trail is written by triggers** and is append-only, including for the
service role. The one event that has no row change (a download) goes through a
function that accepts only that event.

**9. No queue yet.** The analysis runs after the HTTP response (`after()`), claimed
with a conditional update so two workers cannot process the same job. This is the
simplest thing that works for early use; a real queue is a roadmap item because
serverless time limits will bite on long documents.

## Analysis pipeline

1. The user asks for an analysis. The route inserts an `analyses` row **as the
   user** (the database checks role and monthly limit) and answers `202`.
2. The pipeline claims the row, downloads the file, and checks its SHA-256 against
   the value recorded at upload.
3. Text is extracted per page and stored in `document_pages`.
4. The model receives the pages inside `<page number="N">` blocks and must return,
   for every party, term, obligation and risk, a page number and a verbatim quotation.
5. Each quotation is searched in the extracted text (ignoring whitespace, case and
   typographic variants; across a page boundary if needed).
6. `store_analysis_results` writes everything in one transaction and marks earlier
   AI findings of the same contract as superseded (kept, not deleted).

Prompt and schema: `src/lib/ai/prompts.ts`, `src/lib/ai/schema.ts`. Each stored
analysis records the prompt version and the model that produced it.

## Data model (short)

`organizations` ← `memberships` → users · `invitations` · `subscriptions`
`contracts` ← `documents` ← `document_pages`
`contracts` ← `analyses` ← `contract_parties`, `contract_facts`, `risks`, `obligations`
`contracts` ← `reviews` · `audit_log` · view `deadlines`
