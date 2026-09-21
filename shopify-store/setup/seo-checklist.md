# SEO — قائمة تنفيذ بند ببند

## 1) إعدادات المتجر الأساسية

| البند | المكان | القيمة |
|------|--------|--------|
| عنوان المتجر | `Settings → Store details` | `[[STORE_NAME]] — Smart Home & Lifestyle Products in KSA & UAE` |
| وصف المتجر (meta) | `Online Store → Preferences` | وصف من 150–155 حرفاً يذكر المنتجات والسعودية والإمارات |
| الأيقونة (Favicon) | `Customize → Theme settings → Favicon` | لوجو مربّع 512×512 |
| Social sharing image | `Theme settings → Social media` | 1200×630 px |
| كلمة مرور المتجر | `Online Store → Preferences` | **أزلها قبل النشر** — المتجر المقفل لا يُفهرس |

## 2) بنية العناوين (Title tags)

القاعدة: **≤ 60 حرفاً**، الكلمة المفتاحية في البداية، بدون حشو.

```
الرئيسية:     [[STORE_NAME]] — Smart Home & Lifestyle | KSA & UAE
منتج:         <Product Keyword> — <Main Benefit>
مجموعة:       <Collection> — Free Delivery to KSA & UAE
الصفحات:      <Page Name> | [[STORE_NAME]]
```

العناوين الجاهزة للمنتجات الثلاثة موجودة في ملفات `products/`.

## 3) Meta descriptions

**≤ 155 حرفاً**، تتضمّن: المنفعة + السعودية/الإمارات + دعوة للفعل ضمنية.
جاهزة في ملفات `products/`.

⚠️ لا تترك Shopify يولّدها تلقائياً — يقتطع أول سطر من الوصف وغالباً يخرج سيئاً.

## 4) روابط URL نظيفة

```
✅ /products/cordless-split-end-trimmer
❌ /products/cordless-split-end-trimmer-hair-cutter-usb-rechargeable-2026-new
```

قواعد: أحرف صغيرة، شرطات، 3–5 كلمات، بدون تواريخ ولا أرقام موديل.

⚠️ **إذا غيّرت رابطاً بعد النشر:** Shopify يعرض عليك إنشاء redirect — **اقبله دائماً**. الرابط المكسور يخسر ترتيبه بالكامل.

## 5) نص ALT للصور

كل صورة. جاهزة في ملفات `products/`.
- وصفية وحقيقية، لا حشو كلمات مفتاحية
- ≤ 125 حرفاً
- لا تبدأ بـ "صورة لـ" / "image of"

## 6) هيكل العناوين (H1/H2/H3)

- **H1 واحد فقط** لكل صفحة (اسم المنتج على صفحة المنتج)
- H2 للأقسام الرئيسية، H3 للفرعية
- لا تقفز مستوى (H1 → H3 خطأ)

## 7) البيانات المنظّمة (Structured data)

| النوع | الحالة |
|------|--------|
| Product + Offer + AggregateRating | معظم ثيمات Shopify الرسمية تضيفه تلقائياً — **تحقّق** بـ [Rich Results Test](https://search.google.com/test/rich-results) |
| FAQPage | ✅ مضمّن في `theme/sections/faq-accordion.liquid` |
| Organization | أضفه في `theme.liquid` باسمك الحقيقي وبريدك الحقيقي |
| BreadcrumbList | تحقّق من الثيم، أضفه إن كان ناقصاً |

⚠️ **لا تضف AggregateRating وهمياً.** تقييمات مفبركة في البيانات المنظّمة = عقوبة يدوية من Google.

## 8) السرعة (Core Web Vitals)

| الإجراء | الأثر |
|---------|-------|
| صور بصيغة WebP، عرض ≤ 2000px | الأكبر أثراً |
| `loading="lazy"` على كل صورة تحت الطيّة | ✅ مطبّق في أقسامي |
| `fetchpriority="high"` على صورة الـ Hero | ✅ مطبّق |
| `width`/`height` على كل `<img>` | يمنع قفزات التخطيط (CLS) — ✅ مطبّق |
| **احذف التطبيقات غير المستعملة** | كل تطبيق يحقن JS. أكبر سبب لبطء متاجر Shopify. |
| خط واحد، وزنان كحد أقصى | |
| لا سلايدر متحرك في الـ Hero | يضر LCP والتحويل معاً |

اختبر على: [PageSpeed Insights](https://pagespeed.web.dev/) — استهدف **≥ 70 على الجوال**.

## 9) الاستهداف الجغرافي واللغوي

- Shopify Markets يولّد وسوم `hreflang` تلقائياً عند تفعيل اللغة العربية والأسواق
- تحقّق من ظهور: `hreflang="ar-SA"`, `hreflang="ar-AE"`, `hreflang="en"`
- تأكّد من وجود `x-default`

## 10) Google Search Console

1. `Settings → Domains` في Shopify → تحقّق من ملكية النطاق
2. أضف الموقع في [Search Console](https://search.google.com/search-console)
3. أرسل خريطة الموقع: `https://[[STORE_DOMAIN]]/sitemap.xml`
4. راقب أسبوعياً: Coverage، Core Web Vitals، الاستعلامات

## 11) قنوات المبيعات والكتالوجات

| القناة | كيف |
|--------|-----|
| **Google & YouTube** | تطبيق Shopify رسمي → يربط Merchant Center ويرفع كتالوج المنتجات. **مجاني.** |
| **Facebook & Instagram** | تطبيق Shopify رسمي → Meta Commerce Manager + Catalog + Pixel/CAPI |
| **TikTok** | تطبيق Shopify رسمي → TikTok Shop / Catalog + Pixel |

### ⚠️ متطلّبات قبل ربط أي كتالوج
- نطاق موثّق (Domain verification)
- صفحات Refund و Privacy و Terms **منشورة وفعّالة** — ✅ جاهزة في `pages/`
- بيانات اتصال حقيقية ظاهرة
- **Meta و TikTok يرفضان المتاجر التي لا تحتوي سياسات واضحة** — لهذا كتبت الصفحات أولاً

### 🛑 لن أُطلق أي إعلان مدفوع
ربط الكتالوج والبكسل **مجاني ولا يصرف أي مبلغ**. إطلاق الحملات يحتاج موافقتك الصريحة، ولن أفعله.

## 12) المحتوى (المدى الطويل)

مقالات تجلب زيارات مجانية وتدعم صفحات المنتجات:
- "How to dry laundry fast in a humid apartment"
- "Split ends: why cutting more hair doesn't fix them"
- "Does my car have wired CarPlay? How to check in 30 seconds"

اربط كل مقال بصفحة المنتج المناسبة (internal linking).

## قائمة تحقّق نهائية

```
[ ] كلمة مرور المتجر مُزالة
[ ] عنوان ووصف لكل منتج وصفحة ومجموعة
[ ] روابط URL نظيفة + redirects للروابط المتغيّرة
[ ] ALT لكل صورة
[ ] H1 واحد لكل صفحة
[ ] Structured data يمرّ في Rich Results Test
[ ] PageSpeed جوال ≥ 70
[ ] التطبيقات غير المستعملة محذوفة
[ ] hreflang يعمل للعربية والإنجليزية
[ ] Search Console + sitemap مرسل
[ ] Google / Meta / TikTok — كتالوج مربوط، بدون إعلانات
```
