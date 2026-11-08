# NEXORA — الحقائق المسموح قولها

<div dir="rtl">

**آخر مطابقة مع الكود:** 2026-11-08 (commit `75661d4`).
قبل أي منشور: أعد قراءة الملفات المذكورة في عمود «المصدر». إن اختلف الكود عن هذا
الملف، **الكود هو المرجع**: حدّث هذا الملف وأخبر المستخدم بما تغيّر.

## ما هو NEXORA

| الحقيقة | النصّ الرسمي | المصدر |
|---|---|---|
| الاسم | NEXORA | `lib/site.ts` → `SITE_NAME` |
| الشعار | "The executive command center for growing companies" | `lib/site.ts` → `SITE_TAGLINE` |
| الوصف | "One command center for executives: KPIs, projects, tasks, daily reports, approvals, and AI operational intelligence." | `lib/site.ts` → `SITE_DESCRIPTION` |
| العنوان التسويقي | "NEXORA — The Executive Business Operating System" | `app/(marketing)/page.tsx` |
| مسار العمل | Projects & Tasks → Daily Reports → Executive Approvals → AI Strategic Intelligence | `app/(marketing)/page.tsx` → `FLOW` |

**الوحدات الثماني** (`app/(marketing)/page.tsx` → `MODULES`):
Executive Dashboard · Team · Projects · Tasks · Daily Reports (Completed Work / Priorities /
Blockers) · Approvals (budgets, contracts, hiring, exceptions) · AI Intelligence (**preview**) ·
Settings & Governance.

## الحالة الحالية (أهمّ قسم: لا تتجاوزه)

- **Early access**: الواجهة كاملة (8 وحدات) تعمل على **بيانات تجريبية** (sample data).
- **ربط بيانات الشركة الحقيقية غير متاح بعد**؛ «يصل مع الإصدار القادم» (FAQ). المرحلة 2
  (Supabase) **وثيقة تخطيط فقط** (`docs/phase-2-supabase-plan.md`): لا تَعِد بتاريخ.
- **الذكاء الاصطناعي ليس مفعّلاً**: وحدة AI Intelligence تعرض أمثلة ثابتة موسومة
  «preview». ممنوع: "AI-powered" أو "our AI detects…" دون كلمة preview/coming.
  (ملاحظة: `package.json` يقول "AI-powered" — هذا وصف داخلي، لا يُستعمل في المنشورات.)
- **تطبيق قابل للتثبيت (PWA)**: Chrome وEdge وAndroid عبر زرّ "Install NEXORA app"، وiPhone
  عبر Share → Add to Home Screen. الوحدات التي فُتحت تبقى متاحة دون اتصال.
- **الاشتراك**: لا دفع إلكتروني. يُطلب الاشتراك بالبريد عبر زرّ "Request the … plan"
  (العنوان في `lib/site.ts` → `CONTACT_EMAIL`).
- **الخصوصية**: الموقع لا يجمع أي بيانات، بلا حسابات ولا cookies ولا analytics
  (`app/(marketing)/privacy/page.tsx`).

## الأسعار (`lib/data/pricing.ts`) — شرط تجاري: يُنقل كما هو، لا يُعدَّل

| الخطّة | السعر | ما يشتقّه الموقع |
|---|---|---|
| Monthly | 50 USD / month | 600 USD / year |
| Annual | 100 USD / year | ≈ 8.33 USD / month · توفير 500 USD (83%) مقارنةً بالشهري |

> ⚠️ **للتأكيد مع المالك قبل أي منشور يذكر السعر:** السنوي (100) يعادل شهرين من الشهري
> (50)، أي خصماً بـ 83%. إن كان هذا مقصوداً فهو حجّة تسويقية قويّة؛ وإن كان خطأ إدخال
> فإعلانه على LinkedIn يصعّب التراجع عنه. لا تذكر الأسعار حتى يؤكّد المالك.

كل الخطط تتضمّن كل الوحدات (`PLAN_FEATURES`).

## الرابط

- الموقع يُنشر على GitHub Pages. العنوان الافتراضي:
  `https://islamreggam62-max.github.io/Mon-.-premi-re.-Projets-/`
  أو نطاق خاصّ إن ضُبط المتغيّر `CUSTOM_DOMAIN` في GitHub. **à vérifier**: لم يُفتح
  الرابط من بيئة العمل؛ اطلب من المستخدم الرابط النهائي قبل أول منشور ثم سجّله هنا.
- الصفحات المفيدة: الصفحة الرئيسية، `#pricing`، العرض الحيّ `/dashboard`.

## الأصول البصرية الموجودة

- `public/screenshots/wide.png` (لوحة القيادة، سطح المكتب)
- `public/screenshots/narrow.png` (الهاتف)
- `app/opengraph-image.png` (بطاقة المعاينة التي يعرضها LinkedIn عند وضع الرابط)

كل لقطة شاشة تُنشر يجب أن تُفهم على أنها **بيانات تجريبية** (الأسماء والأرقام فيها وهمية).

## ممنوع منعاً باتاً

- عدد زبائن أو مستخدمين، أسماء شركات «تستعمل NEXORA»، شهادات أو تقييمات: لا يوجد شيء من
  ذلك بعد.
- أرقام أداء («يوفّر 10 ساعات أسبوعياً»، «+30% إنتاجية») دون قياس حقيقي موثّق.
- شهادات أمان أو امتثال (SOC 2، ISO 27001، GDPR-certified…)، تكاملات (Slack، Jira…) أو
  تطبيقات أصلية في المتاجر: غير موجودة.
- مقارنة تحطّ من منافس مسمّى.
- تقديم بيانات العرض التجريبي كأنها بيانات زبون حقيقي.

</div>
