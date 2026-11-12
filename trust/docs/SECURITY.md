# Security model

## What the database guarantees

Each line below is checked by `npm run test:db`, which runs the real migrations and
then tries to break them (116 checks). The checks were also run against deliberately
broken policies to confirm that they fail when they should.

- A signed-out caller can read nothing and call nothing.
- A member of one organisation cannot read or change another organisation's
  contracts, documents, findings, members, invitations, plan, audit log or files.
- A row cannot reference a contract or document of another organisation.
- Users cannot create or alter AI findings, their evidence, their severity, or the
  "quotation found" mark. They can change status and add a note.
- Contract status and risk score cannot be edited directly. Approval comes only
  from the named reviewer, who cannot be the requester and must still hold a
  reviewing role. The record and documents are frozen during review.
- Roles change only through functions: an admin cannot create admins or touch
  owners; the last owner cannot be removed or demoted.
- Invitation tokens are stored only as a hash, work once, expire after 7 days and
  are bound to the invited email address.
- Plan limits (seats, contracts, monthly analyses) are enforced by triggers.
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

- **Independent review.** An independent security review was started and did not
  complete. It must be run before real customer data is loaded.
- No multi-factor authentication, SSO or session management screen.
- No rate limiting beyond what Supabase applies.
- No malware scanning of uploaded files.
- No data export, retention schedule or organisation deletion.
- No penetration test.

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
