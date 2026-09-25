# تصميم متاجر Shopify — Shopify Theme Design

## 1. بنية الثيم (Online Store 2.0)

```
layout/theme.liquid        ← الهيكل العام (head، header، footer)
templates/*.json           ← كل صفحة = قائمة sections وترتيبها وإعداداتها
sections/*.liquid          ← أقسام قابلة للإضافة من المحرّر، مع {% schema %}
snippets/*.liquid          ← أجزاء صغيرة قابلة لإعادة الاستعمال
blocks/*.liquid            ← (ثيمات حديثة) كتل مستقلّة
assets/                    ← CSS / JS / صور
config/settings_schema.json ← تعريف إعدادات الثيم (ألوان، خطوط...)
config/settings_data.json   ← القيم الحالية لهذه الإعدادات
locales/*.json             ← الترجمات (ar.json للعربية)
```

ترتيب التفضيل عند التعديل (من الأسلم للأخطر):
1. `config/settings_data.json` — الألوان، الخطوط، الشعار، أزرار... (نفس ما يغيّره محرّر الثيم).
2. `templates/*.json` — إضافة/ترتيب/إعداد الأقسام الموجودة.
3. `sections/` جديدة بأسماء خاصة (مثلاً `custom-trust-bar.liquid`) — لا تتعارض مع تحديثات الثيم.
4. تعديل ملفات الثيم الأصلية — آخر حلّ، ووثّق التغيير.

## 2. سير العمل عبر Admin GraphQL

1. قراءة: `themes(first: 20) { nodes { id name role } }` ثم
   `theme(id:) { files(filenames: [...]) { nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } } } }`.
2. نسخة عمل: `themeDuplicate(id:, name: "تصميم جديد – مسودّة")`.
3. كتابة: `themeFilesUpsert(themeId:, files: [{ filename, body: { type: TEXT, value } }])`.
4. معاينة: `https://<domain>/?preview_theme_id=<numeric id>`.
5. نشر بعد الموافقة فقط: `themePublish(id:)`.

تحقّق دائماً من الأسماء الدقيقة عبر `graphql_schema` قبل التنفيذ.

## 3. الصفحة الرئيسية — ترتيب مقترح

1. شريط إعلان (Announcement bar): الشحن / الدفع عند الاستلام / العرض الحالي.
2. Header: شعار، قائمة قصيرة (≤ 6)، بحث، سلّة.
3. Hero: صورة/فيديو المنتج في الاستعمال + وعد واضح + زر "تسوّق الآن".
4. شريط الثقة: توصيل، دفع عند الاستلام، إرجاع، دعم (أيقونات + نص قصير).
5. المنتجات الأكثر مبيعاً (Featured collection).
6. المزايا / لماذا نحن.
7. آراء العملاء (حقيقية، ويفضَّل مع صور).
8. أسئلة شائعة.
9. Footer: السياسات، التواصل، الشبكات، طرق الدفع.

## 4. صفحة المنتج — أهمّ صفحة للتحويل

- معرض صور: 5–8 صور، الأولى على خلفية نظيفة، ثم صور استعمال، ثم تفاصيل ومقاسات، وفيديو إن أمكن.
- فوق الطيّة على الهاتف: العنوان، التقييم، السعر (+ السعر قبل الخصم)، المتغيّرات، زر الشراء.
- زر "اشترِ الآن" بلون الـ primary، بعرض كامل على الهاتف، وزر ثابت (sticky add-to-cart) عند التمرير.
- تحت الزر مباشرةً: 3 عناصر ثقة قصيرة (توصيل خلال X أيام، الدفع عند الاستلام، إرجاع مجاني/ضمان).
- الوصف: نقاط فوائد قصيرة مع أيقونات، ثم تفاصيل في tabs/accordions (المواصفات، الشحن، الإرجاع).
- آراء العملاء، ثم "قد يعجبك أيضاً".
- لا تشتّت: لا روابط كثيرة، ولا popups فورية.

## 5. الهوية على Shopify

- الألوان والخطوط تُضبط من `settings_data.json` (color schemes في Dawn والثيمات الحديثة).
- الخطوط: استعمل مكتبة خطوط Shopify (`font_picker`) — للعربية: Cairo، Tajawal، Almarai، Noto Kufi Arabic إن توفّرت.
- الشعار: SVG أو PNG شفاف، عرض 120–180px في الهيدر.
- Favicon: 32×32 مربّع.
- الصور: نسبة موحّدة لكل بطاقات المنتجات (مثلاً 1:1 أو 4:5) — إعداد في الثيم.

## 6. العربية و RTL في Shopify

- فعّل اللغة العربية من الإعدادات؛ أغلب الثيمات الحديثة (Dawn ومشتقّاته) تقلب الاتجاه تلقائياً عند `ar`.
- ترجم النصوص في `locales/ar.json` أو عبر تطبيق Translate & Adapt.
- في الـ CSS المخصّص استعمل الخصائص المنطقية (`margin-inline-start`...).
- العملة: تأكّد من تنسيق السعر (مثلاً `{{ amount }} د.ج`) في إعدادات العملة.

## 7. الأداء على Shopify

- `image_url` مع `width` و`image_tag` (يولّد `srcset` تلقائياً): `{{ image | image_url: width: 800 | image_tag: loading: 'lazy' }}`.
- صورة الـ hero: `loading: 'eager', fetchpriority: 'high'`.
- قلّل التطبيقات: كل تطبيق يضيف JS؛ احذف غير المستعمل.
- فيديو الخلفية: قصير، مضغوط، `muted autoplay playsinline` مع poster.

## 8. قواعد كتابة Liquid Sections

- كل section يحتوي `{% schema %}` بـ `name`، `settings`، و`presets` ليظهر في المحرّر.
- كل نص وصورة ولون = إعداد قابل للتعديل (لا نصوص ثابتة في الكود).
- CSS داخل `{% style %}` أو `<style>` مقيّد بمعرّف الـ section: `#shopify-section-{{ section.id }}`.
- استعمل `{{ 'text' | escape }}` للنصوص، و`| t` لنصوص الترجمة.
- اختبر مع إعدادات فارغة (صورة غير محدّدة ⇒ placeholder عبر `placeholder_svg_tag`).
