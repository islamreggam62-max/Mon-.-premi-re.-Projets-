# private/ — ملفات لا تدخل Git

<div dir="rtl">

المستودع عامّ؛ هذا المجلّد مستثنى في `.gitignore` (ما عدا هذا الملف).

| الملف | تنشئه المهارة |
|---|---|
| `voice.md` | `/linkedin-voice` (+ الإعدادات: اللغة، الجمهور، المنطقة الزمنية) |
| `voice-samples.md` | `/linkedin-voice` (النصوص الأصلية) |
| `stories.md` | `/linkedin-interview` |
| `post-log.csv` | `/linkedin-publish` و `/linkedin-analytics` |
| `exports/` | تصديرات LinkedIn Analytics (XLSX/CSV) التي تضعها أنت |

في جلسة سحابية تُمحى هذه الملفات عند انتهاء الجلسة. للاحتفاظ بها: اجعل المستودع خاصّاً
ثم اطلب `git add -f marketing/linkedin/private/<file>`، أو حمّلها عندك.

</div>
