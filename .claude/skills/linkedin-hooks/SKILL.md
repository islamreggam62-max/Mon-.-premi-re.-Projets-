---
name: linkedin-hooks
description: >-
  يكتب الجملة الأولى لمنشور LinkedIn عن NEXORA (الـ hook) في عدّة صيغ، يقيّمها،
  ويتحقّق أنها تُفهم قبل «see more» دون تهويل ولا وعود كاذبة. Writes scroll-stopping
  hooks for NEXORA posts.
---

# /linkedin-hooks — الجملة الأولى

اقرأ أوّلاً `marketing/linkedin/README.md`، `nexora-facts.md`، `private/voice.md`.

## المدخل

موضوع أو مسودّة (`$ARGUMENTS`). إن كانت مسودّة فالمطلوب أن تحسّن افتتاحها فقط.

## أنتج 10 صيغ موزّعة على الأنواع

| النوع | مثال على البنية |
|---|---|
| ملاحظة ملموسة | "Every Friday, the same thing: …" |
| رقم حقيقي | رقم موثّق من القصص أو من الحقائق فقط |
| رأي مخالف | "Weekly status meetings are not a tracking tool." |
| اعتراف | "I got our first pricing page wrong." |
| نتيجة / تحوّل | "From [N] WhatsApp groups to one approval queue." (إن كانت قصّة حقيقية والرقم حقيقياً) |
| سؤال دقيق | سؤال يعرف القارئ جوابه من تجربته |
| مخاطبة جمهور محدّد | "Founders who sign every expense themselves:" |
| فجوة فضول صادقة | تَعِد بما يقدّمه المنشور فعلاً، لا أكثر |
| مشهد | زمان ومكان وتوتّر في سطر |
| تناقض | "We built an AI module. We still call it a preview." |

الأمثلة توضيحية: لا تنسخها، ولا تستعمل أرقاماً أو مواقف غير موجودة في القصص أو الحقائق.

## قيّم كل صيغة (من 5 لكل معيار)

الوضوح دون سياق · التحديد (تفصيل ملموس) · الصدق (لا تهويل، لا وعد لا يفي به المنشور) ·
الملاءمة لجمهور NEXORA · المطابقة لبطاقة الصوت.

ثمّ احسب الطول بـ `python3 marketing/linkedin/tools/check_post.py - ` (الحقل
`first_line_length`): الهدف أن تُفهم الجملة كاملةً في **≤ 140 وحدة** (الطيّ على الهاتف،
تقدير غير رسمي — انظر `linkedin-rules.md`).

## ممنوع

أرقام مخترعة · «You won't believe» · استعجال مصطنع · وسم أشخاص · طُعم تفاعل («Comment
YES») · عبارات `ai-phrases.md` · وعود عن الذكاء الاصطناعي أو ربط البيانات (غير متوفّرين بعد).

## المخرجات

جدول: الصيغة، النوع، الطول، المجموع /25، ملاحظة. ثمّ أفضل 3 مع سبب اختيار كل واحدة،
والسطر الثاني المقترح الذي يحافظ على الفضول بعد الطيّ.

$ARGUMENTS
