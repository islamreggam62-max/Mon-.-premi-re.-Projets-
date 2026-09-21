# تركيب أقسام الثيم

> ⚠️ **خذ نسخة احتياطية أولاً:** `Online Store → Themes → ⋯ → Duplicate`
> اعمل دائماً على النسخة، وانشرها بعد المعاينة. هكذا لا تخسر أي شيء موجود حالياً.

## 1) رفع الملفات

`Online Store → Themes → ⋯ → Edit code`

| الملف | ارفعه إلى |
|------|------------|
| `sections/announcement-bar.liquid` | `sections/` |
| `sections/hero-banner.liquid` | `sections/` |
| `sections/benefits-bar.liquid` | `sections/` |
| `sections/best-sellers.liquid` | `sections/` |
| `sections/faq-accordion.liquid` | `sections/` |
| `sections/trust-badges.liquid` | `sections/` |
| `sections/site-footer.liquid` | `sections/` |
| `snippets/shipping-estimate.liquid` | `snippets/` |
| `snippets/free-shipping-bar.liquid` | `snippets/` |
| `snippets/sticky-atc.liquid` | `snippets/` |
| `assets/custom-store.css` | `assets/` |

## 2) ربط ملف التنسيق

افتح `layout/theme.liquid` وأضف قبل `</head>` مباشرة:

```liquid
{{ 'custom-store.css' | asset_url | stylesheet_tag }}
```

## 3) إضافة الأقسام للصفحة الرئيسية

`Customize → Add section` — والترتيب الموصى به:

```
1. Announcement Bar   ← القسم الجديد (رسائل متناوبة)
2. Header             (من الثيم)
3. Hero Banner        ← القسم الجديد
4. Benefits Bar       ← القسم الجديد
5. Best Sellers       ← القسم الجديد
6. Image with text    (من الثيم — قصة المنتج)
7. FAQ                ← القسم الجديد
8. Trust Badges       ← القسم الجديد
9. Footer             ← القسم الجديد (استبدل فوتر الثيم)
```

**قاعدة مهمة:** لا تتجاوز 7–9 أقسام في الصفحة الرئيسية. الزحمة تقتل التحويل والسرعة معاً.

## 4) إضافة كتلة الشحن لصفحة المنتج

افتح `sections/main-product.liquid` (أو ما يعادله في ثيمك) وضع **تحت زر Add to Cart مباشرة**:

```liquid
{% render 'shipping-estimate' %}
```

ثم افتح `snippets/shipping-estimate.liquid` واستبدل `[[DELIVERY_WINDOW]]` و `[[RETURN_WINDOW]]` بقيمك الحقيقية.

## 4ب) زر الإضافة الثابت على الجوال (مهم جداً للتحويل)

في **نهاية** `sections/main-product.liquid`:

```liquid
{% render 'sticky-atc', product: product %}
```

يظهر شريط إضافة للسلة أسفل الشاشة بمجرّد اختفاء الزر الأصلي عند التمرير — العميل ما يحتاج يرجع لفوق عشان يشتري. **من أعلى التحسينات أثراً على الجوال.**

إذا لم يظهر الشريط: الثيم يستخدم محدّداً مختلفاً لزر الإضافة. افتح `snippets/sticky-atc.liquid` وعدّل قيمة `MAIN_ATC` في السكربت.

## 4ج) شريط الشحن المجاني في السلة

في السلة المنزلقة (cart drawer) **وفي** صفحة السلة:

```liquid
{% render 'free-shipping-bar', threshold_cents: 0 %}
```

- `threshold_cents: 0` → شحن مجاني دائماً (وضعك الحالي)
- `threshold_cents: 20000` → شريط تقدّم نحو حد أدنى قدره 200.00 بالعملة الأساسية

⚠️ **لا تعلن حداً أدنى غير موجود فعلاً** في `Settings → Shipping`.

## 4د) الفوتر

قسم `site-footer` يحتاج قائمتين تنشئهما في `Online Store → Navigation`:

| القائمة | الروابط |
|---------|---------|
| **Help** | تتبّع الطلب، الأسئلة الشائعة، تواصل معنا، سياسة الشحن، سياسة الاسترجاع |
| **Legal** | سياسة الشحن، سياسة الاسترجاع، سياسة الخصوصية، الشروط والأحكام |

ثم اخترهما في إعدادات القسم. **بدون قائمة Legal في الفوتر، Meta و TikTok يرفضان ربط الكتالوج.**

## 5) قبل النشر

```
[ ] أنشأت مجموعة "Best Sellers" وأضفت المنتجات الثلاثة إليها
[ ] اخترت هذه المجموعة في إعدادات قسم Best Sellers
[ ] رفعت صورة Hero لسطح المكتب وصورة عمودية للجوال
[ ] عدّلت لون --cs-accent في custom-store.css ليطابق هويتك
[ ] راجعت الصفحة على جوال حقيقي — لا تمرير أفقي
[ ] كل روابط الفوتر تعمل (السياسات، Contact، Track Order)
[ ] المعاينة سليمة بالعربية RTL
```

## ملاحظات تقنية

- الأقسام تستخدم **CSS logical properties** (`inset-inline-start`, `margin-inline`) فتعمل RTL تلقائياً بدون كود إضافي.
- قسم FAQ يستخدم `<details>/<summary>` الأصلي: يعمل بدون JavaScript، متاح لقارئات الشاشة، وصفر وزن JS.
- الألوان تستجيب للوضع الليلي عبر `prefers-color-scheme`.
- كل الصور فيها `width`/`height` لمنع قفزات التخطيط (CLS)، و`loading="lazy"` تحت الطيّة، و`fetchpriority="high"` لصورة الـ Hero.
- قسم FAQ يولّد **FAQPage structured data** لجوجل (قابل للإيقاف من الإعدادات).
