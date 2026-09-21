# حزمة بناء متجر Shopify — السعودية والإمارات

هذا المجلد يحتوي كل ما يلزم لتجهيز المتجر: تصميم، منتجات، صفحات، أسواق، SEO، تسويق، ودفع.
**كل شيء جاهز للتطبيق** — ينقصه فقط ربط Shopify وقراراتك على النقاط المعلّقة.

## 👉 ابدأ من هنا

**اقرأ [`00-STATUS.md`](00-STATUS.md) أولاً.** فيه ما تم، وما هو موقوف، وما أحتاجه منك.

## خريطة الملفات

```
shopify-store/
├── 00-STATUS.md ............... ابدأ هنا: العوائق + القرارات المطلوبة منك
│
├── products/
│   ├── pricing-and-margins.md . ⚠️ التكلفة والربح — قرار الأسعار ينتظرك
│   ├── 01-smart-retractable-clothesline.md
│   ├── 02-cordless-split-end-trimmer.md
│   └── 03-wireless-carplay-adapter.md
│       └─ كل ملف: عنوان، وصف HTML، مميزات، مواصفات، FAQ، شحن، SEO، ALT
│
├── pages/ ..................... 8 صفحات HTML جاهزة
│   ├── _PLACEHOLDERS.md ....... ⚠️ املأ هذه القيم قبل النشر
│   ├── shipping-policy.html    ├── contact-us.html
│   ├── refund-policy.html      ├── about-us.html
│   ├── privacy-policy.html     ├── faq.html
│   ├── terms-of-service.html   └── track-order.html
│
├── theme/
│   ├── README.md .............. تعليمات التركيب خطوة بخطوة
│   ├── sections/ .............. Announcement, Hero, Benefits, Best Sellers,
│   │                            FAQ, Trust Badges, Footer
│   ├── snippets/ .............. شحن صفحة المنتج، شريط الشحن المجاني،
│   │                            زر الإضافة الثابت للجوال
│   └── assets/custom-store.css  تنسيقات (RTL + وضع ليلي + جوال أولاً)
│
├── translations/ar/ ........... المحتوى العربي (ضروري لسوق خليجي)
│   ├── products-ar.md ......... وصف + مواصفات + FAQ + SEO للمنتجات الثلاثة
│   ├── pages-ar.md ............ الشحن، الاسترجاع، التتبّع، التواصل
│   └── ui-strings-ar.md ....... نصوص كل أقسام الثيم والقوائم والسلة
│
├── setup/
│   ├── markets-currencies-shipping.md .. SAR/AED، اللغة، الشحن، VAT
│   ├── payment-gateways-ksa-uae.md ..... مرجع كل البوابات الخليجية
│   ├── payment-decision-no-gulf-entity.md  ⚠️ ← وضعك أنت: الخطة والتكاليف
│   ├── seo-checklist.md ................ 12 قسماً + قائمة تحقّق
│   └── cro-checklist.md ................ 37 بنداً مرتّبة بالأثر
│
├── marketing/
│   ├── ksa-uae-marketing-plan.md ....... جمهور، ميزانية، قنوات، مواسم
│   └── ad-copy-hooks.md ................ Hooks + سيناريوهات + نصوص (عربي/إنجليزي)
│
└── scripts/
    ├── deploy_to_shopify.py ............ نشر آلي عبر Admin GraphQL API
    └── products.json ................... بيانات المنتجات والصفحات
```

## ترتيب التنفيذ

```
1  ✅ الأسعار اعتُمدت (39.90 / 49.90 / 69.90 $)
2  أعد ربط Shopify connector                   ← إجراء منك
3  أرسل لي صور المنتجات الثلاثة                ← إجراء منك
4  املأ قيم pages/_PLACEHOLDERS.md             ← بياناتك الحقيقية
5  ركّب أقسام الثيم (theme/README.md)
5ب أضف اللغة العربية وترجم من translations/ar/
6  انشر المنتجات والصفحات (scripts/)
7  اضبط Markets + العملات + الشحن (setup/)
8  اضبط SEO واربط الكتالوجات (setup/seo-checklist.md)
9  نفّذ قائمة CRO (setup/cro-checklist.md)
10 ← أخيراً: الدفع (setup/payment-decision-no-gulf-entity.md)
```

## النشر الآلي

```bash
export SHOPIFY_STORE=your-store.myshopify.com
export SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxxxxxx

cd shopify-store/scripts
python3 deploy_to_shopify.py            # معاينة — لا يكتب شيئاً
python3 deploy_to_shopify.py --apply    # ينشئ المنتجات والصفحات
```

خصائص أمان السكربت:
- **المعاينة هي الوضع الافتراضي** — لا يكتب شيئاً إلا مع `--apply`
- **لا يلمس أي منتج أو صفحة موجودة** إلا مع `--update`
- **يرفض النشر** إذا بقيت أي قيمة `[[PLACEHOLDER]]` غير مملوءة
- المنتجات تُنشأ **DRAFT** لتراجعها قبل النشر
- لا يحتوي أي رمز أو مفتاح — يقرأها من متغيّرات البيئة

## 🛑 حدود التزمت بها

- **لم أُطلق أي إعلان مدفوع ولم أصرف أي مبلغ.**
- **لم أستعمل أي معلومة أو وثيقة أو عنوان غير حقيقي** — كل بياناتك الشخصية والتجارية تركتها كـ `[[placeholders]]` تملؤها بنفسك.
- **لم أُنشئ أي حساب بوابة دفع ولم أقدّم أي طلب.**
- **لم أحذف أي ملف موجود مسبقاً** — كل شيء داخل `shopify-store/` فقط.
- كل ما يحتاج Passport أو KYC أو حساباً بنكياً أو OTP أو 2FA: **موثّق لك لتدخله بنفسك**، ولن ألمسه.

## ⚠️ تحقّق قبل النشر

المواصفات في ملفات المنتجات (أطوال، أوزان، سعات بطارية، مواد) **مبنية على مواصفات نموذجية لهذه الفئات** لأنني لم أتمكّن من فتح صفحة المورّد.
**طابقها مع إعلان المورّد الفعلي قبل النشر.** نشر مواصفة غير صحيحة يسبب استرجاعات ونزاعات.
كل ملف منتج فيه تنبيه ⚠️ في مكان التحقّق المطلوب.
