---
name: comite-juridique
description: >-
  اللجنة القانونية (Comité juridique) — «arena» قوية للقانون والعقود: تعرض الملف على عدّة وكلاء مختصّين من
  وكلاء نفطال بالتوازي، ثم يهاجم المعترض النتيجة، ويتحقّق مدقّق المصادر من كل مادّة ورقم وأجل، ثم تُدمج في جواب
  واحد موثَّق. وضع ثانٍ «Arène» يقارن عدّة أجوبة أو مهارات على نفس الملف ويرتّبها بمعايير قانونية. استعملها عند:
  «لجنة»، «comité»، «arena»، «راجع بعمق»، «رأي قانوني معمّق»، «أريد أقوى جواب»، «قارن المهارات في العقود»، أو
  لملف ثقيل (عقد طويل، فسخ، نزاع، عقد دولي، ملحق حسّاس). Legal panel for Naftal contracts: parallel specialists,
  adversarial review, source check, single verified answer; or an arena that ranks answers with legal criteria.
---

# Comité juridique — اللجنة القانونية

نسخة «arena» مخصّصة للقانون: الهدف ليس اختيار فائز فقط، بل **جواب واحد صحيح** تمّت مهاجمته والتحقّق
من مراجعه. تعمل فوق المدير `naftal-contrats` ووكلائه (1 إلى 46)، وتحترم `methode-naftal.md` وكفاءات
المستخدم (`contrat`، `examen-contrat`، `correction-avenant`، `francais-juridique`) التي لها الأولوية.

## متى تُستعمل
- **نعم**: عقد أو ملحق طويل قبل التأشير، فسخ أو إعذار، نزاع، عقد دولي، رأي قانوني لمديرية، ملف فيه
  آجال ومبالغ ونصوص كثيرة، أو حين يطلب المستخدم «أقوى جواب».
- **لا**: رسالة إرجاع «visé» بسيطة أو سؤال قصير ⇒ تُنجز مباشرة بالكفاءة (أسرع وأدقّ).
- نبّه المستخدم أن اللجنة أبطأ وأغلى (من 4 إلى 7 وكلاء).

## الوضع 1 — اللجنة (الافتراضي)

### 1. التحضير (المدير، دون وكيل)
- اقرأ الوثائق كاملة، واستخرج: نوع الوثيقة، المديرية، الشريك، الأرقام، التواريخ، المبالغ، وما يطلبه المستخدم.
- ابحث عن سابقة في `.claude/skills/naftal-contrats/prive/travaux-realises.md` و`prive/archives/`.
- احسب الآجال بنفسك: `python3 .claude/skills/naftal-contrats/scripts/delais.py <départ> <Nj|Nm>`.
- اكتب **ملف القضية** (dossier) في `courriers/<dossier>/brief.md`: الوقائع، النصوص المعنية، السؤال
  الدقيق، والسابقة. كل وكيل يقرأ هذا الملف (لا يُعاد شرح الملف في كل رسالة).

### 2. الفريق (3 مختصّين بالتوازي، في رسالة واحدة)
اختر حسب نوع الملف (`subagent_type` = اسم الوكيل):

| الملف | الفريق |
|---|---|
| فحص عقد قبل التأشير | `naftal-examen-visa` + وكيل المجال (3 بيع، 5 أشغال، 28 Aviation، 29 Marine…) + `naftal-droit-contrats-algerien` |
| ملحق | `naftal-avenants` + `naftal-delais-penalites` + `naftal-procedure-passation` |
| إعذار أو فسخ | `naftal-resiliation` + `naftal-droit-contrats-algerien` + `naftal-cautions-garanties` |
| نزاع | `naftal-contentieux-arbitrage` + `naftal-droit-contrats-algerien` + `naftal-huissiers-encheres` |
| عقد دولي أو استيراد | `naftal-international` + `naftal-change-domiciliation` + `naftal-fiscalite-contrats` |
| صفقة، DAO، لجان | `naftal-procedure-passation` + `naftal-dao-cahiers-charges` + `naftal-commissions-marches` |
| رأي قانوني لمديرية | `naftal-consultations-avis` + وكيل المجال + `naftal-droit-contrats-algerien` |

تعليمات كل وكيل: «اقرأ `courriers/<dossier>/brief.md` والوثائق المذكورة، أجب عن جزئك فقط، اذكر لكل
نتيجة المادّة ومصدرها، وما لم تتحقّق منه اكتب بجانبه (à vérifier). لا تكتب الرسالة النهائية.»

### 3. المسودّة (المدير)
ادمج أجوبة الفريق في مسودّة واحدة بالشكل الذي يطلبه المستخدم (جدول examen-contrat، رأي، تصحيح، رسالة).
عند الاختلاف بين وكيلين: اذكر الرأيين والسبب، ورجّح بالنصّ لا بالأغلبية. احفظها في
`courriers/<dossier>/projet.md`.

### 4. الهجوم والتحقّق (وكيلان بالتوازي، في رسالة واحدة)
- `naftal-contradicteur`: يهاجم `projet.md` كخصم وقاضٍ ولجنة صفقات.
- `naftal-verificateur-sources`: يتحقّق من كل مادّة ورقم وتاريخ ومبلغ وأجل في `projet.md`.

### 5. الحكم والتسليم (المدير)
- صحّح كل ضعف «bloquante» أو «sérieuse» وكل مرجع «erronée»؛ ما بقي «non vérifiable» يوسم (à vérifier).
- مرّر النصّ الفرنسي بكفاءة `francais-juridique`.
- سلّم بالشكل المعتاد (ملف Word بخطّ Times New Roman 12، ثم 3 نقاط تحقّق على الأكثر)، وأضف سطراً
  واحداً: « Revue en comité : N spécialistes, contradicteur, vérification des sources — X référence(s)
  à vérifier ».
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
