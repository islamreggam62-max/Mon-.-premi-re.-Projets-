---
name: comite-juridique
description: >-
  اللجنة القانونية (Comité juridique) — «arena» قوية للقانون والعقود: تعرض الملف على عدّة وكلاء مختصّين من
  وكلاء نفطال بالتوازي، ثم تتداول عليها لجنة من 8 أعضاء دائمين (مقرّر، مفسّر البنود، حارس السوابق، معترض، مدافع، مدقّق مصادر،
  محلّل مخاطر، حارس نماذج)، ثم تُدمج في جواب واحد موثَّق. وضع ثانٍ «Arène» يقارن عدّة أجوبة أو مهارات على نفس الملف ويرتّبها بمعايير قانونية. استعملها عند:
  «لجنة»، «comité»، «arena»، «راجع بعمق»، «رأي قانوني معمّق»، «أريد أقوى جواب»، «قارن المهارات في العقود»، وتعمل **دائماً، كاملةً، على كل عمل في العقود**. Legal panel for Naftal contracts: parallel specialists,
  adversarial review, source check, single verified answer; or an arena that ranks answers with legal criteria.
---

# Comité juridique — اللجنة القانونية

نسخة «arena» مخصّصة للقانون: الهدف ليس اختيار فائز فقط، بل **جواب واحد صحيح** تمّت مهاجمته والتحقّق
من مراجعه. تعمل فوق المدير `naftal-contrats` ووكلائه (1 إلى 46)، وتحترم `methode-naftal.md` وكفاءات
المستخدم (`contrat`، `examen-contrat`، `correction-avenant`، `francais-juridique`) التي لها الأولوية.

## تعمل دائماً، كاملة (قرار المستخدم، 31/10/2026)
**كل عمل يرسله المستخدم في العقود يمرّ على اللجنة الكاملة** (الوضع 1 بخطواته الخمس)، حتى رسالة «visé»
بسيطة، ولا يُسلَّم شيء قبل مرورها.
- الجملة الختامية في التسليم تذكر دائماً: « Revue en comité complet : [3 spécialistes], contradicteur,
  vérification des sources — X référence(s) à vérifier ».
- الوكلاء لا يغيّرون صيغ المستخدم المعتمدة (`contrat`، `lettres-direction-commercialisation`…):
  يقترحون، والمدير يقرّر وفق الكفاءة.
- يبقى للمستخدم أن يقول «بلا لجنة» لعمل بعينه.

## أعضاء اللجنة

| الدور | الوكيل | متى |
|---|---|---|
| المقرّر | `naftal-rapporteur` (47) | الخطوة 1: ملف القضية |
| 3 مختصّين | حسب نوع الملف (الجدول أدناه) | الخطوة 2 |
| مفسّر البنود | `naftal-interprete-clauses` (49) | الخطوة 2: نصّ العقد نفسه |
| حارس السوابق | `naftal-gardien-precedents` (51) | الخطوة 2: قرارات القسم السابقة |
| المعترض | `naftal-contradicteur` (45) | الخطوة 4: يهاجم المسودّة |
| المدافع عن نفطال | `naftal-defenseur` (48) | الخطوة 4: أقوى حجّة لنفطال |
| مدقّق المصادر | `naftal-verificateur-sources` (46) | الخطوة 4: المواد والأرقام والتواريخ والآجال |
| محلّل المخاطر | `naftal-analyste-risques` (50) | الخطوة 4: التعرّض والأولويات والقرار المقترح |
| حارس النماذج | `naftal-gardien-modeles` (52) | الخطوة 4: الشكل والصيغ حرفياً |
| الرئيس | المدير (`naftal-contrats`) | الخطوتان 3 و5: يكتب ويحكم ويسلّم |

## الوضع 1 — اللجنة (الافتراضي)

### 1. التحضير
- المدير يحسب الآجال بنفسه: `python3 .claude/skills/naftal-contrats/scripts/delais.py <départ> <Nj|Nm>`.
- `naftal-rapporteur` يقرأ الوثائق ويكتب **ملف القضية** في `courriers/<dossier>/brief.md` (الوثيقة، الوقائع
  والتسلسل، الأرقام، النصوص، الطلب، الأسئلة، السابقة، النواقص). يعطيه المدير مسارات الوثائق ونتائج `delais.py`.

### 2. الفريق (5 وكلاء بالتوازي، في رسالة واحدة)
3 مختصّين حسب نوع الملف + `naftal-interprete-clauses` + `naftal-gardien-precedents`
(`subagent_type` = اسم الوكيل):

| الملف | المختصّون الثلاثة |
|---|---|
| فحص عقد قبل التأشير | `naftal-examen-visa` + وكيل المجال (3 بيع، 5 أشغال، 28 Aviation، 29 Marine…) + `naftal-droit-contrats-algerien` |
| ملحق | `naftal-avenants` + `naftal-delais-penalites` + `naftal-procedure-passation` |
| إعذار أو فسخ | `naftal-resiliation` + `naftal-droit-contrats-algerien` + `naftal-cautions-garanties` |
| نزاع | `naftal-contentieux-arbitrage` + `naftal-droit-contrats-algerien` + `naftal-huissiers-encheres` |
| عقد دولي أو استيراد | `naftal-international` + `naftal-change-domiciliation` + `naftal-fiscalite-contrats` |
| صفقة، DAO، لجان | `naftal-procedure-passation` + `naftal-dao-cahiers-charges` + `naftal-commissions-marches` |
| رأي قانوني لمديرية | `naftal-consultations-avis` + وكيل المجال + `naftal-droit-contrats-algerien` |
| رسالة إرجاع (visé / corrigé) أو بوردورو | `naftal-lettres-visa` + `naftal-fiche-suivi` + `naftal-francais-administratif` |
| تحقّق من آجال | `naftal-delais-penalites` + `naftal-avenants` + `naftal-droit-contrats-algerien` |
| تصحيح بند أو مادّة | وكيل المجال + `naftal-droit-contrats-algerien` + `naftal-francais-administratif` |

تعليمات كل وكيل: «اقرأ `courriers/<dossier>/brief.md` والوثائق المذكورة، أجب عن جزئك فقط، اذكر لكل
نتيجة المادّة ومصدرها، وما لم تتحقّق منه اكتب بجانبه (à vérifier). لا تكتب الرسالة النهائية.»
(لا يُطلب من مفسّر البنود شيء إن لم يكن في الملف نصّ عقد أو ملحق.)

### 3. المسودّة (الرئيس)
ادمج أجوبة الفريق في مسودّة واحدة بالشكل الذي يطلبه المستخدم (جدول examen-contrat، رأي، تصحيح، رسالة).
عند الاختلاف: اذكر الرأيين والسبب، ورجّح بالنصّ لا بالأغلبية. احفظها في `courriers/<dossier>/projet.md`.

### 4. المداولة (5 وكلاء بالتوازي، في رسالة واحدة)
`naftal-contradicteur` + `naftal-defenseur` + `naftal-verificateur-sources` + `naftal-analyste-risques` +
`naftal-gardien-modeles`، كلّهم على `projet.md` (والمدافع يقرأ أيضاً ما يرد من اعتراضات إن توفّرت).

### 5. الحكم والتسليم (الرئيس)
- كل اعتراض «bloquante» أو «sérieuse»: يُصحَّح، أو يُرَدّ بحجّة المدافع إن كانت أقوى بالنصّ.
- كل مرجع «erronée»: يُصحَّح؛ «non vérifiable»: يوسم (à vérifier).
- كل ملاحظة لحارس النماذج «à corriger»: تُصحَّح دائماً (صيغ المستخدم تتقدّم).
- القرار المقترح (visé / corrigé / non visé) يُعرض على المستخدم، وهو الذي يقرّر.
- مرّر النصّ الفرنسي بكفاءة `francais-juridique`، ثم سلّم بالشكل المعتاد (Word بخطّ Times New Roman 12،
  ثم 3 نقاط تحقّق على الأكثر)، مع السطر: « Revue en comité complet : 11 membres — X objection(s)
  retenue(s), Y référence(s) à vérifier ».
- سجّل الملف في `prive/travaux-realises.md` و`prive/archives/` (قاعدة `CLAUDE.md`).

## الوضع 2 — Arène (المقارنة والترتيب)
لاختيار الأفضل بين عدّة مهارات أو وكلاء أو مسودّات على **نفس** الملف (مثلاً `examen-contrat` /
`contract-review` / `contract-review-pro` / `naftal-examen-visa`)، أو لمقارنة جواب Claude بقرار سابق
للمستخدم.
1. حدّد المتنافسين (2 إلى 6) وأعلن المعايير قبل الإطلاق.
2. أرسل المهمّة نفسها حرفياً لكل متنافس، بالتوازي، **للقراءة فقط** (لا كتابة ملفات).
3. قيّم كل جواب من 1 إلى 5 على المعايير، بجملة تبرير، دون تفضيل الأطول:

| المعيار | ما يُقاس |
|---|---|
| Exactitude juridique | المواد صحيحة ومطبَّقة على الوقائع؛ **كل مرجع مخترَع = 1 في هذا المعيار** |
| Conformité Naftal | قانون خاصّ، الإجراء L089 R6 حيث يُطبَّق، قواعد القسم وكفاءات المستخدم |
| Complétude | الأخطار، البنود الغائبة، الآجال، المبالغ، الضمانات |
| Utilité pratique | صياغة جاهزة، قرار واضح (visé / corrigé / non visé)، الخطوة التالية |
| Forme | فرنسية قانونية، شكل القسم، لا حشو |

4. الحكم: جدول « Rang | Concurrent | Total /25 | Point fort | Point faible »، ثم توصية بجملة واحدة
   (أيّ متنافس لأيّ نوع ملف)، وتُسجَّل في `prive/travaux-realises.md` لتوجيه الاختيار لاحقاً.
5. إن كان للمستخدم قرار سابق في الملف، فهو **المرجع**: يُقاس كل جواب بقربه منه.

## قواعد ثابتة
- لا يخرج أي محتوى عقد إلى خدمة خارجية؛ البحث في الويب بكلمات عامّة فقط.
- المستودع عامّ: `courriers/` و`prive/` فقط للوثائق والأسماء والأرقام الحقيقية.
- الوكلاء الجدد (45 المعترض، 46 مدقّق المصادر) يظهرون كـ `subagent_type` في الجلسات التي تُفتح بعد
  إضافتهم؛ في الجلسة الحالية، إن لم يكونا متاحين، نفّذ دورهما بوكيل `general-purpose` مع نصّ ملفّهما
  (`.claude/agents/naftal-contradicteur.md`، `.claude/agents/naftal-verificateur-sources.md`).
