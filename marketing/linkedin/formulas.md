# 20 هيكلاً لمنشورات NEXORA

<div dir="rtl">

هياكل كتابة معروفة في الإعلان والكتابة المهنية، مكيّفة مع NEXORA. لا شيء منها «مضمون»:
ما ينجح مع جمهورك يُقاس بـ `/linkedin-analytics`. الهياكل مكتوبة بالإنجليزية لأنها لغة
المنشورات الافتراضية؛ تُترجم الفكرة لا الحروف عند الكتابة بالفرنسية أو العربية.

**الركائز (pillars):** ⓐ تسيير الشركات والقيادة التنفيذية · ⓑ بناء NEXORA علناً ·
ⓒ عرض المنتج · ⓓ قصص ودروس شخصية.

| # | الهيكل | الركيزة | يحتاج |
|---|---|---|---|
| 1 | Build in public — weekly update | ⓑ | ما أُنجز فعلاً هذا الأسبوع |
| 2 | PAS — Problem / Agitate / Solve | ⓐⓒ | مشكلة حقيقية يعرفها المسيّرون |
| 3 | BAB — Before / After / Bridge | ⓐⓒ | وضع «قبل» ملموس |
| 4 | Story → Lesson | ⓓ | قصّة من `private/stories.md` |
| 5 | The mistake I made | ⓑⓓ | خطأ حقيقي وما تغيّر بعده |
| 6 | Contrarian take | ⓐ | رأي تدافع عنه بحجّة |
| 7 | Myth vs Reality | ⓐ | اعتقاد شائع خاطئ |
| 8 | How-to in N steps | ⓐ | طريقة قابلة للتطبيق غداً |
| 9 | Template / checklist give-away | ⓐⓒ | نموذج حقيقي قابل للنسخ |
| 10 | Named framework | ⓐ | نموذج من 3–4 عناصر |
| 11 | Behind the decision | ⓑ | قرار تقني أو منتج ولماذا |
| 12 | One-feature walkthrough | ⓒ | لقطة شاشة + مشكلة واحدة |
| 13 | Old way vs new way | ⓐⓒ | مقارنة بالطريقة الحالية (لا بمنافس مسمّى) |
| 14 | Genuine question / poll | ⓐ | سؤال تريد جوابه فعلاً |
| 15 | Real milestone | ⓑ | إنجاز حقيقي قابل للتحقّق |
| 16 | Pattern I keep seeing | ⓐ | ملاحظة متكرّرة (مجرّدة من أي جهة عمل) |
| 17 | Objection / FAQ answered | ⓒ | سؤال حقيقي طُرح عليك |
| 18 | Launch / announcement | ⓒ | خبر حقيقي (إطلاق، ميزة، خطّة) |
| 19 | N lessons from… | ⓑⓓ | دروس عشتها |
| 20 | Origin story — why NEXORA exists | ⓓⓑ | قصّتك الحقيقية |

---

## التفاصيل

### 1. Build in public — weekly update
```
[Week N of building NEXORA.]
Shipped: [1–3 concrete things].
Learned: [one honest lesson].
Next: [what comes next — no dates you can't keep].
[Question to the audience.]
```
زاوية NEXORA: ما أُضيف فعلاً في الـ commits (مثال حقيقي: جعل NEXORA قابلاً للتثبيت ويعمل
دون اتصال). اقرأ `git log` للتحقّق قبل الكتابة.

### 2. PAS
```
[Problem in one sentence the reader recognises.]
[Agitate: what it costs — time, decisions made blind, surprises.]
[Solve: the principle first, then how NEXORA approaches it.]
```
زاوية: المدير الذي يكتشف المشروع المتأخّر في اجتماع آخر الشهر. لا أرقام مخترعة عن «الكلفة».

### 3. BAB
```
Before: [the messy reality].
After: [what "good" looks like].
Bridge: [the habit or tool that gets you there].
```
زاوية: موافقات متفرّقة بين البريد والهاتف ← طابور موافقات واحد مرتّب حسب الاستعجال.

### 4. Story → Lesson
```
[Moment: time, place, tension — 2–3 short lines.]
[What happened.]
[What I understood.]
[How it applies to the reader.]
```
المصدر الوحيد: `private/stories.md` بعد مرشّح السرّية.

### 5. The mistake I made
```
I got [X] wrong.
[What I did and why it seemed right.]
[What it cost.]
[What I do now.]
```

### 6. Contrarian take
```
Most [audience] believe [common view].
I think [your view].
Here's why: [2–3 reasons].
[Where you might be wrong — invites discussion.]
```
زاوية: «الاجتماعات الأسبوعية ليست أداة متابعة؛ التقرير اليومي في 3 أسطر أنجع».

### 7. Myth vs Reality
```
Myth: [...]
Reality: [...]
(×3)
[Takeaway.]
```

### 8. How-to in N steps
```
How to [result] in [N] steps:
1. ...
2. ...
3. ...
[Which step do you skip most often?]
```

### 9. Template / checklist give-away
```
The [template] I'd give every team lead:
[The template itself, copy-ready.]
[Why each part matters.]
```
زاوية حقيقية من المنتج: التقرير اليومي بأقسامه الثلاثة Completed Work / Priorities / Blockers.

### 10. Named framework
```
I use a simple model: [Name].
[Element 1] → [Element 2] → [Element 3] → [Element 4].
[One line per element.]
```
زاوية: مسار NEXORA نفسه: Projects & Tasks → Daily Reports → Executive Approvals →
AI Strategic Intelligence (الأخير: preview).

### 11. Behind the decision
```
We decided to [decision].
Options we had: [A / B].
Why [choice]: [reasons].
Trade-off we accept: [...]
```
زاوية: لماذا تطبيق PWA يعمل دون اتصال بدل تطبيق متجر؟ لماذا وسم الذكاء الاصطناعي «preview»؟

### 12. One-feature walkthrough
```
[Problem the feature solves.]
[Screenshot.]
[3 things to notice in it.]
[Try it in the live demo.]
```
وضّح أن اللقطة من **بيانات تجريبية**.

### 13. Old way vs new way
```
Old way: [...]
New way: [...]
(3–5 lines)
```
قارن بـ «جداول Excel + بريد + مجموعات WhatsApp»، لا بمنتج منافس مسمّى.

### 14. Genuine question / poll
```
[Context in 2 lines.]
[One precise question.]
[Your own answer, to start the thread.]
```

### 15. Real milestone
```
[Milestone, factual.]
[What it took.]
[Thanks — only to people who agreed to be named.]
[What's next.]
```
ممنوع: أرقام زبائن أو زيارات غير موثّقة.

### 16. Pattern I keep seeing
```
I keep seeing the same pattern in [context]:
[Pattern.]
[Why it happens.]
[What helps.]
```
**تنبيه السرّية:** لا شيء يمكن ربطه بجهة العمل الحالية أو بملفّ بعينه.

### 17. Objection / FAQ answered
```
"[Question I get]"
Short answer: [...]
Longer answer: [...]
```
مثال حقيقي من FAQ الموقع: "Is the AI live?" → "Not yet — and here's why we label it preview."

### 18. Launch / announcement
```
[News in one sentence.]
[Who it's for.]
[What it does today — and what it doesn't yet.]
[CTA: live demo / request a plan.]
```

### 19. N lessons from…
```
[N] lessons from [experience]:
1. ...
(5–7 max)
[Which one resonates?]
```

### 20. Origin story
```
[The frustration that started it.]
[The moment you decided to build.]
[What NEXORA is today — honestly: early access, sample data.]
[Where it's going.]
```

</div>
