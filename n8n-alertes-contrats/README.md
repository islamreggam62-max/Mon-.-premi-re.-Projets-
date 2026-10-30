# تنبيهات آجال العقود — n8n → Telegram

<div dir="rtl">

مثال كامل: **جدول عقود تجريبي** في Google Sheets، و**workflow n8n** يقرأه كل صباح
على الساعة 8:00 (بتوقيت الجزائر) ويبعث لك **تنبيهًا على Telegram قبل كل أجل بـ15 يومًا**.

| الملف | المحتوى |
|---|---|
| `contrats.csv` | جدول 8 عقود تجريبية، تستورده في Google Sheets |
| `workflow-alertes-contrats.json` | الـworkflow، تستورده في n8n |
| `test/echeances.test.mjs` | اختبار منطق حساب الآجال |

## كيف يعمل

</div>

```
Chaque matin à 8h ─► Lire le tableau des contrats ─► Calculer les échéances ─► Envoyer l'alerte Telegram
 (Schedule)            (Google Sheets)                  (Code)                     (Telegram)
```

<div dir="rtl">

لكل عقد **أجلان** محتملان:

1. **Fin du contrat** — تاريخ `date_fin`.
2. **Date limite du préavis** — `date_fin` ناقص `preavis_jours` (آخر يوم لإرسال الإشعار
   بعدم التجديد). هذا هو الأجل الذي يُنسى عادةً، خاصة مع `reconduction_tacite = oui`.

إذا كان أحد الأجلين بعد 15 يومًا بالضبط، تصلك رسالة. إذا لم يكن هناك شيء، لا تصلك
أي رسالة. العقود التي حالتها `Terminé` أو `Résilié` أو `Archivé` لا تُحسب.
والسطر المملوء خطأً (تاريخ غير مفهوم مثلًا) يرسل تحذيرًا بدل أن يُتجاهَل بصمت.

مثال على الرسالة:

</div>

```
⏰ Échéance dans 15 jours

📄 CTR-2026-002 — Bail commercial – local Bab Ezzouar
🤝 Cocontractant : SARL Immo Atlas
📌 Date limite du préavis (90 j avant la fin)
📅 samedi 14/11/2026
👤 Responsable : Sara

➡️ Envoyer la dénonciation avant cette date pour éviter la reconduction tacite.
```

<div dir="rtl">

## أعمدة الجدول

| العمود | مثال | ملاحظة |
|---|---|---|
| `reference` | CTR-2026-001 | |
| `intitule` | Maintenance du parc informatique | |
| `cocontractant` | SARL InfoTech Services | |
| `type` | Prestation de services | للمعلومة فقط |
| `date_debut` | 2025-11-15 | للمعلومة فقط |
| `date_fin` | 2026-11-15 | يُقبل `AAAA-MM-JJ` أو `JJ/MM/AAAA` |
| `preavis_jours` | 30 | عدد الأيام؛ `0` أو فارغ = بلا préavis |
| `reconduction_tacite` | oui / non | يغيّر فقط النصيحة في الرسالة |
| `responsable` | Amine | |
| `statut` | Actif / Terminé | |

## التركيب خطوة بخطوة

### 1. بوت Telegram

1. في Telegram افتح **@BotFather** ← `/newbot` ← اختر اسمًا ← احتفظ بالـ**token**.
2. افتح المحادثة مع بوتك الجديد واضغط **Start** (بدونها لا يستطيع البوت مراسلتك).
3. لمعرفة الـ**chat ID** الخاص بك: افتح **@userinfobot** وسيعطيك رقمك
   (أو افتح `https://api.telegram.org/bot<TOKEN>/getUpdates` وخذ `message.chat.id`).

### 2. جدول Google Sheets

1. أنشئ Google Sheet جديدًا باسم **Contrats**، وسمِّ الورقة (l'onglet) أيضًا **Contrats**.
2. **Fichier ← Importer ← Importer** ← ارفع `contrats.csv` ← اختر
   *Remplacer la feuille actuelle*.
3. تأكد أن الـlocale هو France أو Algérie (**Fichier ← Paramètres**)، حتى تُكتب التواريخ
   `JJ/MM/AAAA` وليس بالصيغة الأمريكية `MM/JJ/AAAA`.

### 3. n8n

1. **Workflows ← Import from File** ← اختر `workflow-alertes-contrats.json`.
2. عقدة **Lire le tableau des contrats**: أنشئ credential Google، ثم اختر ملف *Contrats*.
3. عقدة **Envoyer l'alerte Telegram**: أنشئ credential Telegram بالـtoken، وعوّض
   `TON_CHAT_ID` برقمك.
4. **جرّب الآن بدون انتظار**: في عقدة **Calculer les échéances** ضع
   `const DATE_TEST = '2026-10-31';` ثم **Execute workflow** — تصلك رسالتان
   (CTR-2026-001 و CTR-2026-008). بعدها أرجعها `''`.
5. فعّل الـworkflow (**Active**). n8n يجب أن يبقى شغّالًا (n8n Cloud أو سيرفر).

## مواعيد التنبيهات مع الجدول التجريبي

</div>

| يوم الإرسال | العقد | الأجل |
|---|---|---|
| 30/10/2026 | CTR-2026-002 | Date limite du préavis → 14/11/2026 |
| 31/10/2026 | CTR-2026-001 | Fin du contrat → 15/11/2026 |
| 31/10/2026 | CTR-2026-008 | Date limite du préavis → 15/11/2026 |
| 05/11/2026 | CTR-2026-004 | Fin du contrat → 20/11/2026 |
| 10/11/2026 | CTR-2026-008 | Fin du contrat → 25/11/2026 |
| 15/11/2026 | CTR-2026-005 | Fin du contrat → 30/11/2026 |
| 16/12/2026 | CTR-2026-003 | Fin du contrat → 31/12/2026 |
| 31/12/2026 | CTR-2026-006 | Date limite du préavis → 15/01/2027 |

<div dir="rtl">

`CTR-2026-007` أجله 14/11/2026 لكنه `Terminé`، لذلك لا يرسل شيئًا.

## الإعدادات (أعلى عقدة Code)

- `RAPPELS = [15]` — عدد الأيام قبل الأجل. التنبيه يُرسَل في اليوم J-15 **بالضبط**:
  إذا كان n8n متوقفًا ذلك الصباح يضيع التنبيه. للأمان ضع مثلًا `[15, 7, 1]`.
- `DATE_TEST` — لتجربة يوم آخر غير اليوم.
- `STATUTS_IGNORES` — الحالات التي لا تُحسب.
- الساعة: في عقدة **Chaque matin à 8h**. التوقيت `Africa/Algiers` في إعدادات الـworkflow.

## الاختبار

</div>

```bash
node --test n8n-alertes-contrats/test/echeances.test.mjs
```

<div dir="rtl">

الاختبار يشغّل نفس كود عقدة Code الموجود داخل `workflow-alertes-contrats.json` على
`contrats.csv`، إذن إذا عدّلت الكود في n8n أعد تصدير الـworkflow إلى هذا الملف.

</div>
