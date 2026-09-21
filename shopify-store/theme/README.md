# تركيب أقسام الثيم

> ⚠️ **خذ نسخة احتياطية أولاً:** `Online Store → Themes → ⋯ → Duplicate`
> اعمل دائماً على النسخة، وانشرها بعد المعاينة. هكذا لا تخسر أي شيء موجود حالياً.

## 1) رفع الملفات

`Online Store → Themes → ⋯ → Edit code`

| الملف | ارفعه إلى |
|------|------------|
| `sections/hero-banner.liquid` | `sections/` |
| `sections/benefits-bar.liquid` | `sections/` |
| `sections/best-sellers.liquid` | `sections/` |
| `sections/faq-accordion.liquid` | `sections/` |
| `sections/trust-badges.liquid` | `sections/` |
| `snippets/shipping-estimate.liquid` | `snippets/` |
| `assets/custom-store.css` | `assets/` |

## 2) ربط ملف التنسيق

افتح `layout/theme.liquid` وأضف قبل `</head>` مباشرة:

```liquid
{{ 'custom-store.css' | asset_url | stylesheet_tag }}
```

## 3) إضافة الأقسام للصفحة الرئيسية

`Customize → Add section` — والترتيب الموصى به:

```
1. Announcement bar   (من الثيم — اكتب: شحن مجاني + استرجاع)
2. Header             (من الثيم)
3. Hero Banner        ← القسم الجديد
4. Benefits Bar       ← القسم الجديد
5. Best Sellers       ← القسم الجديد
6. Image with text    (من الثيم — قصة المنتج)
7. FAQ                ← القسم الجديد
8. Trust Badges       ← القسم الجديد
9. Footer             (من الثيم)
```

**قاعدة مهمة:** لا تتجاوز 7–9 أقسام في الصفحة الرئيسية. الزحمة تقتل التحويل والسرعة معاً.

## 4) إضافة كتلة الشحن لصفحة المنتج

افتح `sections/main-product.liquid` (أو ما يعادله في ثيمك) وضع **تحت زر Add to Cart مباشرة**:

```liquid
{% render 'shipping-estimate' %}
```

ثم افتح `snippets/shipping-estimate.liquid` واستبدل `[[DELIVERY_WINDOW]]` و `[[RETURN_WINDOW]]` بقيمك الحقيقية.

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
