# نظام التصميم — Design System

كل مشروع يبدأ بتعريف هذه القيم كمتغيّرات CSS في `:root`. لا تكتب ألواناً أو
مسافات "سحرية" داخل المكوّنات؛ استعمل المتغيّرات دائماً.

## 1. الألوان

هيكل التوكنز (غيّر القيم حسب الهوية):

```css
:root {
  /* العلامة */
  --color-primary: #2f5bea;        /* CTA، روابط */
  --color-primary-hover: #2449c4;
  --color-on-primary: #ffffff;
  --color-accent: #f5a524;         /* تمييز نادر: شارات، عروض */

  /* السطوح والنص */
  --color-bg: #ffffff;
  --color-surface: #f6f7f9;        /* بطاقات، أقسام بديلة */
  --color-border: #e3e6eb;
  --color-text: #14171f;
  --color-text-muted: #5b6270;

  /* الحالات */
  --color-success: #1f9d55;
  --color-warning: #c77c02;
  --color-danger: #d93636;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-primary: #6d8cff;
    --color-primary-hover: #8aa3ff;
    --color-on-primary: #0b0d12;
    --color-bg: #0e1015;
    --color-surface: #171a21;
    --color-border: #262a33;
    --color-text: #eef0f4;
    --color-text-muted: #a0a7b4;
  }
}
:root[data-theme="dark"] { /* نفس قيم الوضع الداكن */ }
```

### لوحات جاهزة حسب الشخصية

| الشخصية | primary | accent | bg | text | ملاحظات |
|---|---|---|---|---|---|
| عصري تقني | `#2f5bea` | `#14b8a6` | `#ffffff` | `#14171f` | زوايا 12px، ظلال خفيفة |
| فاخر أنيق | `#1c1a17` | `#b08d57` (ذهبي) | `#faf8f5` | `#1c1a17` | خط serif للعناوين، زوايا 0–4px، مساحات واسعة |
| دافئ ودود | `#e4572e` | `#ffc857` | `#fffaf3` | `#2b2118` | زوايا 16–24px، رسوم يدوية |
| طبيعي / صحّي | `#2f7d4f` | `#e9c46a` | `#f7f9f4` | `#1d2a22` | ألوان ترابية، صور طبيعية |
| جريء شبابي | `#7c3aed` | `#f43f5e` | `#0f0f14` | `#f5f5f7` | تدرّجات، خطوط عريضة، وضع داكن افتراضي |
| طبّي / موثوق | `#0f6fb8` | `#22b8a6` | `#ffffff` | `#102030` | نظيف جداً، أيقونات خطية |

قواعد: 60% محايد (bg/surface) · 30% نص وعناصر ثانوية · 10% primary/accent.
تحقّق من التباين: نص عادي ≥ 4.5:1، نص كبير وعناصر UI ≥ 3:1.

## 2. الخطوط

```css
:root {
  --font-sans: "IBM Plex Sans Arabic", "Inter", system-ui, sans-serif;
  --font-display: "Cairo", var(--font-sans);

  /* سُلّم مرن (نسبة ~1.25) */
  --text-xs:  clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem);
  --text-sm:  clamp(0.875rem, 0.85rem + 0.15vw, 0.9375rem);
  --text-base: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --text-lg:  clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem);
  --text-xl:  clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem);
  --text-2xl: clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem);
  --text-3xl: clamp(2.25rem, 1.7rem + 2.6vw, 3.5rem);
}
```

أزواج مجرَّبة (عناوين / نص):

| عربي | لاتيني | الطابع |
|---|---|---|
| Cairo / IBM Plex Sans Arabic | Inter | عصري متوازن |
| Tajawal / Tajawal | Poppins | ودود، بسيط |
| Reem Kufi / Almarai | Playfair Display / Lato | فاخر |
| Noto Kufi Arabic / Noto Sans Arabic | Noto Sans | رسمي، متعدّد اللغات |
| Readex Pro / Readex Pro | Readex Pro | تقني، متغيّر الوزن |

الأوزان: 400 للنص، 500–600 للأزرار والتسميات، 700–800 للعناوين. حمّل الأوزان
المستعملة فقط مع `display=swap`.

## 3. المسافات والتخطيط

```css
:root {
  --space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem;
  --space-4: 1rem;     --space-5: 1.5rem;  --space-6: 2rem;
  --space-7: 3rem;     --space-8: 4rem;    --space-9: 6rem;

  --container: 1200px;
  --gutter: clamp(1rem, 4vw, 2rem);
  --section-y: clamp(3rem, 8vw, 6rem);
}
.container { max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }
```

نقاط الكسر (mobile-first): `640px` · `768px` · `1024px` · `1280px`.
شبكات مرنة بلا media queries: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));`

## 4. الشكل والعمق والحركة

```css
:root {
  --radius-sm: 6px; --radius: 12px; --radius-lg: 20px; --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / .06);
  --shadow:    0 4px 16px rgb(0 0 0 / .08);
  --shadow-lg: 0 12px 40px rgb(0 0 0 / .12);
  --ease: cubic-bezier(.2, .8, .2, 1);
  --dur: 200ms;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

الحركة: 150–300ms للتفاعلات، `transform` و`opacity` فقط (أداء أفضل). لا حركة بلا وظيفة.

## 5. المكوّنات الأساسية

- **الزر:** ارتفاع ≥ 44px، `padding-inline` ≥ 20px، حالات: default / hover / active /
  focus-visible (حلقة واضحة) / disabled. نوعان كافيان: primary و secondary (outline/ghost).
- **البطاقة:** `surface` + `border` أو `shadow` (ليس الاثنين بقوة)، `radius` موحّد، padding ≥ `--space-5`.
- **الحقول:** label ظاهر دائماً (لا placeholder كبديل)، ارتفاع ≥ 44px، رسالة خطأ تحت الحقل بلون danger ونص.
- **الـ Navbar:** شعار + 3–6 روابط + CTA؛ قائمة burger على الهاتف؛ `position: sticky` مع خلفية شبه شفافة و`backdrop-filter`.
- **الـ Hero:** عنوان (≤ 10 كلمات) + سطر شرح + CTA رئيسي + ثانوي اختياري + صورة/مرئي. `min-height` معقول، ليس بالضرورة 100vh.
- **Footer:** روابط مجمّعة، تواصل، شبكات اجتماعية، حقوق.

## 6. الصور والأيقونات

- صيغ حديثة (WebP/AVIF)، `width`/`height` محدّدة لتفادي القفز (CLS)، `loading="lazy"` لكل ما تحت الطيّة.
- `aspect-ratio` + `object-fit: cover` لبطاقات موحّدة.
- أيقونات: مجموعة واحدة فقط (Lucide، Heroicons، Phosphor، Tabler) بنفس السُمك.
- `alt` وصفي للصور المفيدة، `alt=""` للزخرفية.
