# CLAUDE.md — NEXORA Executive Business Operating System

## 1. Project Vision & Architecture
- **Name:** NEXORA
- **Type:** Global AI-powered Executive Business Operating System (SaaS).
- **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React icons.
- **Purpose:** Centralizing enterprise execution, team management, daily structured reporting, task tracking, and AI operational intelligence.

## 2. The 8 Core Modules
1. `/` (Dashboard): Executive Command Center (KPIs, project health, alerts).
2. `/team`: Organization directory, departments, roles, and workloads.
3. `/projects`: Strategic initiatives and milestone trackers.
4. `/tasks`: Granular task execution board/lists with priorities and statuses.
5. `/daily-reports`: Structured end-of-day check-ins (Completed, In Progress, Blockers, Tomorrow's Plan).
6. `/approvals`: Executive sign-off workflow queue (budget, hiring, exceptions).
7. `/ai-intelligence`: Executive AI synthesis and risk analysis UI (Demo mode in Phase 1).
8. `/settings`: Workspace preferences, RBAC preview, and configuration.

## 3. Visual Identity & UI Standards
- **Theme:** Premium Dark Mode Enterprise SaaS.
- **Colors:** Deep Dark Navy backgrounds (`#070B14`, `#0F172A`, `#1E293B`) with Royal Violet accents (`#7C3AED`, `#8B5CF6`).
- **Surface Accents:** Clean slate borders (`rgba(255,255,255,0.08)`), high data density, subtle glassmorphism, and clear status badges (Emerald, Amber, Rose).

## 4. Development Rules & Guardrails
- Strict TypeScript interfaces for all domain entities.
- Clean separation between UI views and static demo data layers.
- Do NOT implement fake backend APIs or unauthorized mock servers.
- Maintain full responsiveness across mobile, tablet, and desktop viewports.

## 5. Implementation Notes (Phase 1)

Added after the Phase 1 build; sections 1–4 above are the original brief.

- **Versions:** Next.js 16.4 (Turbopack, Cache Components, Partial Prefetching, typed routes), React 19.3, Tailwind CSS 4 (`@theme` tokens in `src/app/globals.css`, no `tailwind.config`), lucide-react 1.x, Vitest 5.
- **Layers** (dependencies point downward only):
  1. `src/types/` — domain interfaces and enums (`as const` tuples + derived unions; template-literal IDs such as `` `prj-${string}` ``).
  2. `src/data/` — static demo records only. No logic, no imports from `lib/`.
  3. `src/lib/analytics/` — pure functions over records (risk, workload, compliance, insights, KPIs, briefing). Never import `@/data`.
  4. `src/lib/queries.ts` — the only module that binds data to analytics; returns one typed view model per page. `server-only`. Phase 2 replaces the `@/data` imports here.
  5. `src/components/` + `src/app/` — UI. Components never import `@/data`.
- **Time:** never call `Date.now()` or `new Date()` without arguments. Everything is anchored to `workspace.asOf` / `workspace.today` (Fri 30 Oct 2026); this keeps prerendering deterministic under Cache Components.
- **Formatting:** always through `src/lib/format.ts` (explicit `en-US` locale, explicit time zones, 24-hour clock) so server and client output match during hydration.
- **Status colors** always ship with an icon and a text label (`src/lib/presentation.ts`); roles and categories use neutral or brand tones.
- **AI module:** Phase 1 output is rule-based and must stay labelled "demo mode". Do not simulate model answers.
- **Demo mutations** (approve/reject, check-in submission, settings) live in component state, are labelled "not saved", and are never sent anywhere.
- **Before committing:** `npm run check` (typecheck, lint, unit tests, production build).

@AGENTS.md
