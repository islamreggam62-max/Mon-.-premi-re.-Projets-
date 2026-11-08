---
date: 2026-11-10
slot: à définir (/linkedin-timing)
account: personal
language: en
pillar: ⓒ
formula: 17
hook_type: question réelle
format: image
has_link: false
status: draft
note: premier brouillon d'exemple, écrit sans private/voice.md (voix générique) — à repasser par /linkedin-voice puis /linkedin-humanizer
---
<!-- post -->
People ask me if the AI in NEXORA is live.

Not yet.

The AI Intelligence module shows how a risk radar, bottleneck detection and executive report synthesis will look. Every example in it is static, and the screen says so: preview.

I could have dropped that word. A demo with "AI" on every card sells better.

But NEXORA is built for executives who approve budgets, contracts and hires. If the first thing they see is a claim we can't back yet, why would they trust the dashboard next to it?

What works today, on sample data:
• Executive dashboard: KPIs, department health, critical blockers
• Daily reports: Completed Work, Priorities, Blockers
• One approval queue for budgets, contracts, hiring and exceptions
• Installable on desktop, Android and iPhone, and it works offline

Connecting your own company's data comes with the next release. The AI comes after that.

If you run a team: what should an AI flag first for you, delays, blockers, or budget drift?
<!-- /post -->

## الصورة المقترحة

لقطة وحدة AI Intelligence من العرض الحيّ (`/ai-intelligence`) تُظهر وسم «preview»، أو
`public/screenshots/wide.png`. بيانات تجريبية.

## تعليق أوّل (اختياري)

"The live demo runs on sample data, no sign-up: <lien NEXORA à confirmer>"
(أثر الرابط في التعليق غير مؤكّد — انظر `linkedin-rules.md`.)

## الحقائق المستعملة

| الادّعاء | المصدر |
|---|---|
| AI Intelligence = risk radar, bottleneck detection, executive synthesis, preview | `app/(marketing)/page.tsx` → `MODULES` + FAQ "Is the AI live?" |
| الأمثلة ثابتة وموسومة preview | FAQ "Is the AI live?" |
| الموافقات: budgets, contracts, hiring, exceptions | `MODULES` → Approvals, `PLAN_FEATURES` |
| KPIs, department health, critical blockers | `PLAN_FEATURES` |
| Completed Work / Priorities / Blockers | `MODULES` → Daily Reports |
| قابل للتثبيت، يعمل دون اتصال | `PLAN_FEATURES`، FAQ |
| sample data | FAQ "What do I get today?" |
| ربط البيانات مع الإصدار القادم | FAQ "What do I get today?" |
| الذكاء الاصطناعي بعد ذلك | `docs/phase-2-supabase-plan.md`: "AI tables … belong to the AI phase, not Phase 2" |
| "I could have dropped that word…" | **رأي يُنسب إلى المؤلّف — à confirmer par l'auteur** |
| "People ask me…" | **à confirmer par l'auteur** (هل طُرح السؤال فعلاً؟ وإلا: "A question I expect from every executive:") |

## الفحص

انظر مخرجات `python3 marketing/linkedin/tools/check_post.py` على هذا الملف.
