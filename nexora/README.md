# NEXORA — Executive Business Operating System

A premium, responsive enterprise-SaaS application built with Next.js (App
Router), TypeScript and Tailwind CSS.

NEXORA runs in two modes, decided automatically at runtime:

- **Demo mode** (default) — no database connected. Every figure, person and
  activity is clearly-labeled fictional sample data from `src/lib/demo-data.ts`.
  All routes are open; a persistent "Demo mode" banner is shown.
- **Live mode** — once Supabase env vars are present, the same screens read
  **real workspace data** through Row-Level Security, authentication is required
  (login/sign-up), and the demo banner disappears.

The switch is a single check (`isSupabaseConfigured()`); no code changes are
needed to go from demo to live — only environment variables.

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Framework      | Next.js 14.2 (App Router)                |
| Language       | TypeScript (strict)                      |
| Styling        | Tailwind CSS v3 + CSS design tokens      |
| Backend        | Supabase (Postgres + Auth + RLS)         |
| Icons / charts | lucide-react · recharts                  |
| Identity       | Dark navy canvas · violet brand accent   |

## Getting started

```bash
cd nexora
npm install
npm run dev        # http://localhost:3000  (demo mode until .env.local is set)
```

Scripts: `npm run dev` · `npm run build` · `npm run start` · `npm run lint`.

## Deploy — get a live link (no terminal needed)

The app runs in demo mode with **no setup**, so you can host it and open it on
any device before touching Supabase. Easiest path (free):

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New → Project**, import this repository.
3. Set **Root Directory** to `nexora` (important — the app lives in a
   subfolder). Framework preset auto-detects as Next.js.
4. Click **Deploy**. In ~1 minute you get a public URL.

Opening that URL lands directly on the dashboard (demo mode) — **no login
required**. To switch it to real data later, add the two
`NEXT_PUBLIC_SUPABASE_*` values in Vercel → Project → Settings → Environment
Variables and redeploy.

## Connecting Supabase (going live)

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Add env vars** — copy `.env.example` to `.env.local` and fill in, from
   *Project Settings → API*:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   `.env.local` is git-ignored. The anon key is safe in the browser — it is
   protected by Row-Level Security. Never commit the service-role key.
3. **Apply the schema** — run `supabase/migrations/0001_init.sql` via the
   Supabase CLI (`supabase db push`) or paste it into the SQL editor. It creates
   the tables, Row-Level Security policies, and a trigger that provisions a
   workspace + profile for each new user.
4. **(Optional) seed sample data** — run `supabase/seed.sql`, then point your
   user at the demo workspace (instructions are in that file).
5. **Enable auth** — in *Authentication → Providers*, enable Email (and set a
   password policy / confirm-email preference). Restart `npm run dev`.

On restart, the app requires sign-in and reads live data. Any query that fails
(e.g. tables not migrated yet) falls back to demo data so the UI never crashes.

## What's included

**App shell** — fixed desktop sidebar, mobile slide-over drawer, sticky top bar,
account menu with sign-out (live mode), demo/live status indicator.

**Eight pages** — Dashboard, AI Intelligence, Team, Projects, Tasks, Daily
Reports, Approvals, Settings. All read through the data layer.

**Auth** — `/login` (password + magic link), `/auth/callback`, `/auth/signout`,
and middleware that refreshes sessions and gates app routes (live mode only).

**Database** — `supabase/migrations/0001_init.sql`: workspace-scoped tables with
uniform RLS policies, a `handle_new_user` trigger, and Realtime publication for
the activity feed and approvals.

### Not yet implemented

- Persisting approval decisions, task edits and settings (reads are live; writes
  are the next step — Server Actions over the same tables).
- Any real/simulated **AI** — the AI Intelligence page is placeholder content
  behind a "no model connected" disclosure.
- **Stripe / billing.**

## Project structure

```
nexora/
├── src/
│   ├── app/
│   │   ├── (app)/           # shelled, authenticated pages (dashboard, team, …)
│   │   ├── login/           # auth entry (outside the shell)
│   │   ├── auth/            # callback + signout route handlers
│   │   └── layout.tsx       # root (html/body); (app)/layout.tsx adds the shell
│   ├── components/          # shell, ui primitives, charts
│   ├── lib/
│   │   ├── data.ts          # data-access layer (Supabase ↔ demo fallback)
│   │   ├── auth.ts          # current-profile helper
│   │   ├── demo-data.ts     # labeled sample data + shared UI types
│   │   └── supabase/        # client, server, middleware, config, types
│   └── middleware.ts        # session refresh + route gating
└── supabase/
    ├── migrations/0001_init.sql
    └── seed.sql
```

## Design system

Semantic color tokens are RGB triplets on `:root` in `src/app/globals.css`
(so Tailwind `/<alpha>` opacity works) and mapped to utilities in
`tailwind.config.ts`: `bg`, `surface`, `surface-2`, `card`, `border`,
`foreground`, `muted`, `subtle`, `brand` (violet), and
`success`/`warning`/`danger`/`info`.
