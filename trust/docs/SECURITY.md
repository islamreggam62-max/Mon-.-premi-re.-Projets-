# Security model

## What the database guarantees

Each line below is checked by `npm run test:db`, which runs the real migrations and
then tries to break them (152 checks). The checks were also run against deliberately
broken policies to confirm that they fail when they should.

- A signed-out caller can read nothing and call nothing.
- A member of one organisation cannot read or change another organisation's
  contracts, documents, findings, members, invitations, plan, audit log or files.
- A row cannot reference a contract or document of another organisation.
- Users cannot create or alter AI findings, their evidence, their severity, or the
  "quotation found" mark. They can change status and add a note.
- Contract status and risk score cannot be edited directly. Approval comes only
  from the named reviewer, who cannot be the requester and must still hold a
  reviewing role.
- While a contract is under review, approved or in force, its record and documents
  are locked. Changing them means reopening it as a draft, which removes the
  approval. Findings cannot be regenerated during a review. A pending review can be
  withdrawn by its requester or an administrator.
- A document's storage path is fully determined by its ids. It cannot contain a
  parent-folder segment, a query string or another organisation's folder.
- An analysed document cannot be deleted on its own (its findings would go with it).
- Users can add a file to their organisation's folder and nothing else: they cannot
  read, replace or delete stored files directly. Downloads go through the server,
  which records each one; users cannot write audit entries at all.
- Contract owners and obligation assignees must be members of the organisation;
  the assignment is cleared when the member leaves.
- Roles change only through functions: an admin cannot create admins or touch
  owners; the last owner cannot be removed or demoted.
- Invitation tokens are stored only as a hash, work once, expire after 7 days and
  are bound to the invited email address.
- Plan limits (seats, contracts, monthly analyses) are enforced by triggers. AI usage
  is counted in an append-only ledger, so deleting contracts does not reset the quota.
  One account can create at most five organisations. Only one analysis of a contract
  runs at a time.
- An invitation is accepted only by the invited address, and only once that address
  has been confirmed.
- The audit log cannot be updated, deleted or truncated, even by the server role,
  and users cannot imitate system entries.

## Roles

| | Viewer | Reviewer | Manager | Admin | Owner |
|---|---|---|---|---|---|
| Read contracts, findings, deadlines | ✓ | ✓ | ✓ | ✓ | ✓ |
| Triage risks, add manual risks | | ✓ | ✓ | ✓ | ✓ |
| Decide a review assigned to them | | ✓ | | ✓ | ✓ |
| Create and edit contracts, upload, analyse | | | ✓ | ✓ | ✓ |
| Delete contracts and documents, read audit log | | | | ✓ | ✓ |
| Invite and manage members below admin | | | | ✓ | ✓ |
| Manage admins and owners | | | | | ✓ |

## Application-level controls

- File type is decided from the file's bytes; size is capped at 25 MB in the
  application, the table and the bucket. DOCX decompression is bounded.
- All input is validated on the server with zod. Redirect targets are same-site
  paths only. Banner messages come from a fixed list of codes.
- Raw database and provider errors are never sent to the browser.
- Security headers: HSTS, no framing, no content sniffing, strict referrer policy.
- The analysis endpoint rejects cross-site requests and unauthenticated callers.
- Contract text is treated as data in the prompt, the model's answer is constrained
  to a schema, and nothing from the model is rendered as HTML.

## Threats and how they are handled

| Threat | Handling | Residual risk |
|---|---|---|
| Cross-tenant data access | RLS + composite keys + tests | A future table added without a policy. Rule: no table without a test. |
| Leaked service-role key | Server-only, one import site | Full database access if leaked. Rotate; keep it out of logs and CI output. |
| Model invents a clause | Quotation must be found in the document | A real quotation with a wrong interpretation still passes. Human review remains necessary. |
| Malicious document instructs the model | Prompt rules + schema-constrained output + no tool access | The model could still be steered to omit or downgrade findings. Evaluation set needed (roadmap). |
| Runaway AI cost | Monthly limit per organisation, one running analysis per contract | A member can use the whole monthly quota. |
| Reviewer collusion or self-approval | Requester ≠ reviewer, enforced in the database | Two colluding members can approve. Audit log records both. |
| Account takeover | Supabase Auth, 10-character minimum password | No MFA or SSO yet (roadmap). |

## Not done yet

- **Second independent review.** One independent review was run (see below). The
  reviewer was stopped before it could re-test the fixes, so a second pass by someone
  who did not write them is still required before real customer data is loaded.
- **Concurrency.** Two fixes rely on row locks (last-owner check, document lock during
  a review request). They were reasoned about, not tested with parallel sessions.
- **Hostile PDFs.** The Word parser is bounded and tested against a pathological file.
  PDF parsing relies on pdf.js and runs in the web process without a time limit; a
  worker with a timeout is on the roadmap.
- **Trial expiry** is not enforced (only a cancelled subscription blocks new work):
  what happens at the end of a trial is a commercial decision.
- No multi-factor authentication, SSO or session management screen.
- No rate limiting beyond what Supabase applies.
- No malware scanning of uploaded files.
- No data export, retention schedule or organisation deletion.
- No penetration test.

## Independent review, November 2026

An independent reviewer read the migrations, server code and routes and proved most
findings by running statements against the real migrations. All were fixed in the
same change, each with a regression test in `supabase/tests/` or `tests/`.

| Severity | Finding | Fix |
|---|---|---|
| Critical | The stored file path only had to *start* with the organisation's folder. A crafted path made the server-side analysis fetch another organisation's file, or another address on the same host, with the server's key. | The path is now fixed by a database constraint to `<org>/<contract>/<document>.<ext>`, and the server builds it from validated ids instead of reading it. |
| High | A tiny crafted Word file made text extraction take minutes (quadratic pattern matching). | Linear tokenizer, smaller size cap, timing test. |
| High | The monthly AI quota counted rows the user could delete. | Append-only usage ledger; organisation creation counted per account; daily ceiling across all organisations. |
| High | An approved contract could be rewritten and its documents replaced while staying approved. | Record and documents locked while under review, approved or in force; reopening removes the approval. |
| Medium | Deleting a document silently deleted its AI findings. | Analysed documents cannot be deleted on their own. |
| Medium | Stored files could be swapped under a document row; downloads could bypass the audit log. | Users can only add files; downloads are issued and recorded by the server. |
| Medium | A pending review could not be withdrawn if the reviewer left. | `cancel_review`. |
| Medium | A redirect parameter accepted tab and carriage-return characters; the email link could sign a visitor into someone else's account. | Strict path check; only the browser-bound confirmation flow is accepted. |
| Low | Races on the last-owner check and on adding a document during a review request; forged download entries; analysis not tied to its contract's document; membership probing; assignees outside the organisation; unconfirmed email on invitations. | Fixed (locks, constraints, server-only functions). |

The reviewer's report was cut off before its "informational" notes and its list of
what it found sound, so those are not reflected here.

## Data protection: assumptions to verify

These are working assumptions, not legal conclusions. None of the texts below was
checked against its official source while writing this file.

| Topic | Assumption | To verify |
|---|---|---|
| Algeria | Law 18-07 of 10 June 2018 on personal data applies to customers established in Algeria. | Text and implementing rules on JORADP; current status of the national authority's requirements; rules on transfers abroad. |
| European Union | The GDPR (Regulation (EU) 2016/679) applies when customers or data subjects are in the EU. | Role (processor), data processing agreement, transfer mechanism. |
| Location of data | Data sits in the region chosen for the Supabase project. | Region choice per customer requirements. |
| AI provider | Contract text is sent to Anthropic's API for analysis. | Provider's retention and training terms for the account used; whether customers' contracts permit it; customer consent wording. |
| Confidentiality | Contracts often contain third parties' confidential information. | Terms of service and customer agreement drafted by counsel. |
