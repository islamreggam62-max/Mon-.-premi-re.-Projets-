# NEXORA — Executive Business Operating System

**Phase 1 — UI foundation.** A premium, responsive enterprise-SaaS interface
built with Next.js (App Router), TypeScript and Tailwind CSS. This phase is the
front-end shell only: every figure, person and activity you see is clearly
labeled **demo data**. There is **no backend, no database, no AI inference and
no billing** wired up yet — those arrive in later phases.

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | Next.js 14.2 (App Router, static export) |
| Language       | TypeScript (strict)                      |
| Styling        | Tailwind CSS v3 + CSS design tokens      |
| Icons          | lucide-react                             |
| Charts         | recharts                                 |
| Visual identity| Dark navy canvas · violet brand accent   |

## Getting started

```bash
cd nexora
npm install
npm run dev     # http://localhost:3000
```

Other scripts:

```bash
npm run build   # production build (type-checks + lints)
npm run start   # serve the production build
npm run lint    # eslint (next/core-web-vitals)
```

## What's in Phase 1

A responsive app shell (fixed sidebar on desktop, slide-over drawer on mobile,
sticky top bar) wrapping eight functional, navigable pages:

- **Dashboard** — KPI tiles, revenue-vs-target chart, AI signal, weekly
  activity, recent activity feed, project health and approvals preview.
- **AI Intelligence** — insight cards behind a prominent "no model connected"
  disclosure; the prompt box is intentionally disabled.
- **Team** — member directory with status, department and utilization.
- **Projects** — portfolio cards with progress, budget burn and team.
- **Tasks** — Kanban board grouped by stage (Backlog → Done).
- **Daily Reports** — end-of-day updates with completed items and blockers.
- **Approvals** — decision queue with ephemeral, in-memory approve/reject
  (resets on reload — nothing is persisted).
- **Settings** — profile, appearance, notification toggles (local only) and an
  integrations panel showing Supabase/Billing as **Not connected**.

### Deliberately NOT included (per Phase 1 scope)

- No backend API or database calls.
- No real or simulated AI functionality.
- No Stripe / billing configuration.
- No API keys or secrets anywhere in the codebase.

## Project structure

```
nexora/
├── src/
│   ├── app/                 # routes (one folder per page) + layout + globals.css
│   ├── components/
│   │   ├── shell/           # app-shell, sidebar, topbar
│   │   ├── ui/              # card, badge, button, avatar, progress, stat-card…
│   │   └── charts/          # recharts wrappers (revenue, activity)
│   └── lib/
│       ├── nav.ts           # single source of truth for navigation
│       ├── demo-data.ts     # ALL sample data (replaced by the data layer later)
│       └── utils.ts         # cn(), formatters
├── tailwind.config.ts       # color tokens, shadows, gradients
└── ...
```

## Design system

Semantic color tokens are defined as RGB triplets on `:root` in
`src/app/globals.css` (so Tailwind's `/<alpha>` opacity works) and mapped to
Tailwind utilities in `tailwind.config.ts`. Key tokens: `bg`, `surface`,
`surface-2`, `card`, `border`, `foreground`, `muted`, `subtle`, `brand`
(violet), plus `success` / `warning` / `danger` / `info`.

## Next phase — Supabase integration (not yet implemented)

Planned, in order:

1. **Project & env** — create a Supabase project; put `NEXT_PUBLIC_SUPABASE_URL`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (git-ignored). Keep the
   service-role key server-side only — never in client code.
2. **Client** — add `@supabase/supabase-js` (+ `@supabase/ssr` for App Router
   session handling); create a typed server client and a browser client.
3. **Schema** — tables for `profiles`, `team_members`, `projects`, `tasks`,
   `daily_reports`, `approvals`; enable Row-Level Security with per-workspace
   policies from day one.
4. **Auth** — Supabase Auth (email/OAuth); gate the app shell behind a session;
   wire the top-bar account menu to the real user.
5. **Data layer** — replace the exports in `src/lib/demo-data.ts` with queries
   (Server Components / server actions). The UI already reads from that single
   module, so the swap is localized.
6. **Realtime** — subscribe the activity feed and approvals queue to Supabase
   Realtime channels.

Everything in `demo-data.ts` is the contract the real data layer will fulfill.
