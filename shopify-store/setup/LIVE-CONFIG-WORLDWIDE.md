# التحديث الثاني — البيع العالمي وعزل ألمانيا

> التاريخ: 2026-09-23 · يلغي جزئياً `LIVE-CONFIG-5-MARKETS.md`

## ما تغيّر بطلبك

### 1) ألمانيا — معزولة بطبقتين

| الطبقة | الإجراء |
|--------|---------|
| السوق | `Germany (isolated - not selling)` → **DRAFT** |
| الشحن | منطقة `Germany - not served` تحتوي DE **بدون أي سعر شحن** |

الزائر الألماني لا يستطيع إتمام طلب. هذا أيضاً يزيل عنك خطر الـ **Abmahnung** الذي حذّرتك منه (Impressum + حق الإلغاء 14 يوماً) — لم تعد مضطراً لتجهيزه.

### 2) الشحن — أصبح عالمياً

| المنطقة | التغطية | السعر |
|---------|---------|-------|
| Domestic | الجزائر | كما كان |
| **Worldwide** | **كل دول العالم (Rest of World)** | **Free Standard Shipping** |
| Germany - not served | ألمانيا | لا يوجد — محجوبة |

### 3) الأسواق

| السوق | العملة | الحالة |
|-------|--------|--------|
| **Tout le monde (Worldwide)** | USD + **عملات محلية تلقائية** | ACTIVE — ٢٣١ دولة |
| Saudi Arabia | SAR | ACTIVE |
| United Arab Emirates | AED | ACTIVE |
| United States | USD | ACTIVE |
| Australia | AUD | ACTIVE |
| Algérie | — | ACTIVE |
| Germany | EUR | **DRAFT — معزول** |
| International | — | DRAFT |

`localCurrencies: true` على السوق العالمي يعني أن الزائر من اليابان أو البرازيل يرى السعر بعملته تلقائياً.

### 4) أسعار الـ ٥ الكبار

| المنتج | السعر | التكلفة | الربح | الهامش |
|--------|-------|---------|-------|--------|
| Heated Insulated Lunch Box 1.5 L | **$80** | $33.45 | $46.55 | 58% |
| Electric Lunch Box 1.5 L 60W | **$70** | $27.68 | $42.32 | 60% |
| Electric Lunch Box 900 ml | **$60** | $21.16 | $38.84 | 65% |
| KZ ZSN Pro X Earphones | **$50** | $23.85 | $26.15 | 52% |
| T9 Cordless Hair & Beard Trimmer | **$40** | $9.45 | $30.55 | 76% |

### 5) إصلاح سعر المقارنة المكسور

كل المنتجات المستوردة كان فيها `compare-at` **أقل** من سعر البيع — تكلفة المورّد نزلت في الخانة الغلط.

**مُسح `compare-at` من ٣٤ متغيّراً** عبر ١١ منتجاً. التكلفة كانت أصلاً محفوظة صح في `Cost per item`، فلم تُفقد أي بيانات وحساب الربح في Shopify يبقى سليماً.

المنتجات المصلَّحة: Slim Bathroom Trash Can · Compact Sensor Bin · Smart Sensor Trash Can 15L · Kinesiology Tape · Yoga Balance Pad · Interlocking Foam Mats · Racket Overgrip · Nose Hair Scissors · Nose & Ear Trimmer · Smart Glasses XG89 · Smart Glasses D11

---

## ⚠️ ما زال مفتوحاً

1. **الدفع** — متجرك في الجزائر: Shopify Payments وStripe وPayPal لا تدعم استقبال المدفوعات هناك. **البيع عالمياً بلا بوابة = لا تحصيل.** هذا البند الأول.
2. **اللغة الأساسية فرنسية** والمحتوى إنجليزي → `Settings → Languages → Change primary → English`
3. **منتجات بلا صور** ما زالت DRAFT: Clothesline · Split-End Trimmer · CarPlay Adapter · UV Toothbrush · Jump Rope Mat · Self-Heating Lunch Box
4. **Smart Glasses XG89 بـ $6.34 و D11 بـ $27.43** — أسعار تكلفة، لم أغيّرها لأنها خارج الـ٥ التي اخترتها.
5. **الشحن المجاني عالمياً** — الشحن للبرازيل أو أستراليا أغلى بكثير من الخليج. راقب هامشك بعد أول طلبات بعيدة.
