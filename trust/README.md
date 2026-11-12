# TRUST — contract risk & intelligence

TRUST is a multi-tenant web application that helps an organisation understand and
control its contracts: it stores them, reads PDF and Word files, extracts the
parties, dates, amounts and obligations, points out risky clauses, tracks
deadlines, and routes contracts through review and approval.

Every AI finding shows **where it comes from**: the page, the clause and the exact
words. Before a finding is stored, the platform looks the quoted words up in the
document. A finding whose quotation is not there is kept but marked unconfirmed,
and does not count toward the risk score.

> TRUST supports a professional's review. It does not replace qualified legal
> counsel. "Quotation found" means the words are in the document at that place;
> it does not mean the interpretation is legally correct.

## What is built

| Area | State |
|---|---|
| Accounts, organisations, five roles, invitations | Built |
| Tenant isolation in the database (row-level security) | Built, 116 automated checks |
| Contract records, PDF/DOCX upload, private file storage | Built |
| Text extraction with page numbers (PDF exact, DOCX approximate) | Built, unit-tested |
| AI analysis with evidence check (Claude API) | Built; pipeline tested end to end with a scripted model; **not yet run against the live API** |
| Risks and obligations: triage, manual entries, assignees | Built |
| Deterministic risk score per contract | Built (in the database) |
| Deadlines: expiry, notice window, dated obligations | Built |
| Review and approval with separation of duties | Built |
| Append-only audit trail | Built |
| Plan limits (seats, contracts, analyses per month) | Built; **values are placeholders** |
| Dashboard | Built |
| Online payment | Not built (data model only) |
| Email (invitations, reminders) | Not built: invitation links are copied by hand |
| OCR for scanned PDFs | Not built: scans are refused with a clear message |
| Queue/worker for analyses | Not built: runs after the HTTP response on the web server |

**Not verified in a real environment:** the application has not yet been run
against a real Supabase project or the live Claude API. What has been verified is
listed under "Checks" below. The first real run is step 1 of `docs/ROADMAP.md`.

## Set up

Requirements: Node 20.19+ (22 recommended), a Supabase project, a Claude API key.

1. **Database.** In the Supabase SQL editor (or with `supabase db push`), run the
   files in `supabase/migrations/` in order: `0001_schema.sql`, then `0002_storage.sql`.
2. **Authentication settings** (Supabase → Authentication):
   - Keep **email confirmation ON**. Invitations are bound to the invited email
     address, which is only meaningful if addresses are confirmed.
   - Add `https://YOUR-DOMAIN/auth/confirm` to the allowed redirect URLs.
3. **Environment.** Copy `.env.example` to `.env.local` and fill it in.
   `SUPABASE_SECRET_KEY` and `ANTHROPIC_API_KEY` are server-only secrets.
4. **Run.**
   ```bash
   npm install
   npm run dev          # http://localhost:3000
   ```
5. Create an account, confirm the email, create your organisation, add a contract.

## Checks

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm test               # unit tests: extraction, evidence check, payload, pipeline, formatting
npm run test:db        # runs the real migrations on a throwaway local Postgres and
                       # tries to break tenant isolation and the workflow rules
npm run build
```

Render smoke test (needs Playwright with Chromium; uses fixed sample data, so it
proves that pages render on phone and desktop sizes, not that data is right):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54399 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=smoke npx next build
node tests/smoke/render-smoke.mjs
```

`npm run test:db` needs Postgres 15+ binaries on the machine, or set
`TEST_DATABASE_URL` to an **empty** scratch database. Never point it at a real project.

## Layout

```
supabase/migrations/   schema, RLS policies, workflow functions, storage policies
supabase/tests/        database security tests (+ a test-only stand-in for Supabase roles)
src/lib/documents/     PDF and DOCX text extraction
src/lib/ai/            prompt, output schema, model call, evidence check, pipeline
src/lib/actions.ts     server actions (all run as the signed-in user)
src/app/               pages and route handlers
tests/                 unit tests and the render smoke test
docs/                  architecture, security model, roadmap
```

The team of specialised agents that maintains this project is defined in
`../.claude/agents/trust-*.md`, with its orchestrator in `../.claude/skills/trust/SKILL.md`.

## Known limits

- **Hosting body size.** Files are posted through a server action so they can be
  checked on the server (up to 25 MB). Hosts that cap request bodies lower (Vercel:
  4.5 MB) need direct-to-storage uploads first; see the roadmap.
- **Long analyses.** An analysis runs after the HTTP response on the same server
  and is limited by the host's maximum duration (set to 300 s). A job that dies is
  shown as failed after 15 minutes and can be started again.
- **Very long documents** (over about 1.2 million characters) are refused rather than cut.
- **Word files** have no fixed pages: locations are section numbers. Headers,
  footers, footnotes and text boxes are not read.
- **Interface language** is English only. Contract text and findings display
  right-to-left correctly, but the interface is not translated.
- **Lists** load up to 500–1000 rows without paging.
