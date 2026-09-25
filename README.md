# cyber-orchestrator — منسّق استطلاع

<div dir="rtl">

**منسّق استطلاع (Reconnaissance) تعليمي محكوم بالأذونات.**

يُظهر البنية الحقيقية لخطّ تقييم أمني — *استطلاع ← فحص ← تقرير* — مع جعله
**من المستحيل تشغيله ضد هدف لم تُعلن صراحةً أنك مُصرَّح لك باختباره**. لا يقوم
إلا بمراقبة غير تدخّلية (استعلامات DNS، فحص منافذ TCP-connect، طلب HTTP واحد).
لا يوجد هنا أي استغلال للثغرات، ولا تخمين لكلمات المرور، ولا حجب خدمة (DoS)،
ولا تهرّب من الكشف — وذلك بحكم التصميم.

> ⚠️ **استخدمه فقط على الأنظمة التي تملكها أو صُرّح لك صراحةً باختبارها.**
> الفحص غير المصرَّح به لأجهزة لا تملكها غير قانوني في معظم الدول. هذا المشروع
> موجّه للمختبرات المنزلية، ومسابقات CTF، والمهام المُصرَّح بها.

## كيف تعمل بوابة الأمان

لا شيء يعمل حتى تُوفّر ملف `authorization.yaml` الذي:

1. يذكر المشغّل والمهمّة،
2. يضبط `i_am_authorized: true` (إقرار صريح)، و
3. يُدرج **نطاقًا (scope)** كقائمة سماح بالمضيفين/نطاقات CIDR.

يُفحَص كل هدف مقابل هذا النطاق قبل أن تمسّه أي وحدة. افتراضيًا تُقبل عناوين
الحلقة المحلية / الخاصة / المحلية للوصلة فقط، بحيث لا يمكن لأول تشغيل أن يصل
إلى الإنترنت العام. الأهداف خارج النطاق تُتخطّى وتُسجَّل، ولا تُفحَص أبدًا.

## البداية السريعة

</div>

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp authorization.example.yaml authorization.yaml
# عدّل authorization.yaml: اضبط i_am_authorized: true ونطاقك

# افحص هدفًا داخل نطاقك المُعلَن
python -m orchestrator 127.0.0.1 -v
```

<div dir="rtl">

## الاستخدام

</div>

```bash
python -m orchestrator [targets...] [options]

  -a, --auth PATH        ملف الأذونات (الافتراضي: authorization.yaml)
  -m, --modules LIST     وحدات للتشغيل مفصولة بفواصل
  -f, --format {text,json}
  -o, --output PATH      كتابة التقرير إلى ملف
      --list-modules     عرض الوحدات المتاحة
  -v, --verbose
```

<div dir="rtl">

## الوحدات المضمّنة

| الوحدة             | ما تفعله (غير تدخّلية)                                 |
|--------------------|-------------------------------------------------------|
| `dns_recon`        | تحليل DNS مباشر وعكسي                                  |
| `port_scan`        | فحص TCP-connect للمنافذ الشائعة (مصافحات عادية)        |
| `http_fingerprint` | طلب GET واحد؛ يسجّل الحالة والترويسات والعنوان          |

أضِف وحداتك الخاصة بوراثة `orchestrator.modules.base.Module` وتسجيلها في
`orchestrator/modules/__init__.py`.

## البنية المعمارية

</div>

```
orchestrator/
  authorization.py   # بوابة الأمان (منع افتراضي، قائمة سماح للنطاق)
  engine.py          # يشغّل الوحدات لكل هدف مُصرَّح ← RunReport
  reporting.py       # RunReport ← نص / JSON
  cli.py             # واجهة سطر الأوامر
  modules/
    base.py          # صنف Module الأساس + ModuleResult
    recon_dns.py
    port_scan.py
    http_fingerprint.py
```

<div dir="rtl">

## الاختبارات

</div>

```bash
pip install pytest
python -m pytest -q
```

<div dir="rtl">

## الرخصة

MIT

</div>

<div dir="rtl">

## وكلاء Shopify (Claude Code)

في `.claude/agents/` وكيل لكل خدمة متّصلة، كلّها مخصّصة للعمل على متجر Shopify:

| الوكيل             | الخدمة           | ماذا يفعل للمتجر                                              |
|--------------------|------------------|---------------------------------------------------------------|
| `shopify`          | Shopify          | إدارة المنتجات والمجموعات والطلبات والمخزون والخصومات          |
| `shopify-canva`    | Canva            | صور المنتجات، بنرات المتجر، منشورات العروض                     |
| `shopify-gmail`    | Gmail            | ربط رسائل العملاء بطلباتهم وكتابة مسودّات الردود (بلا إرسال)   |
| `shopify-calendar` | Google Calendar  | تقويم الحملات والإطلاقات وتذكيرات المخزون ومراجعة المبيعات     |
| `shopify-drive`    | Google Drive     | استيراد الكتالوجات وتصدير تقارير المبيعات والمخزون             |
| `shopify-linear`   | Linear           | تدقيق المتجر وتحويل مشاكله إلى مهام، ومشاريع الإطلاق           |
| `shopify-notion`   | Notion           | قاعدة بيانات المنتجات، دليل خدمة العملاء، التقارير الشهرية     |
| `shopify-github`   | GitHub           | كود الثيم (Liquid) والتطبيقات، عبر فروع وPR فقط                |
| `shopify-slack`        | Slack ⚠️          | ملخّصات المبيعات اليومية وتنبيهات الطلبات والمخزون              |
| `shopify-paypal`       | PayPal ⚠️         | مطابقة المدفوعات مع الطلبات، النزاعات، تقارير الإيرادات         |
| `shopify-microsoft365` | Microsoft 365 ⚠️  | مسودّات Outlook، تقارير OneDrive، تحديثات Teams                 |
| `shopify-atlassian`    | Atlassian ⚠️      | تذاكر Jira من تدقيق المتجر، توثيق Confluence                    |
| `shopify-gamma`        | Gamma ⚠️          | عروض أداء، كتالوجات، صفحات هبوط                                  |
| `shopify-gcp`          | Compute Engine ⚠️ | خوادم تطبيقات Shopify والـ webhooks                              |
| `shopify-chatgpt`      | ChatGPT ⚠️        | رأي ثانٍ في أوصاف المنتجات وSEO والإعلانات                       |
| `shopify-manus`        | Manus ⚠️          | بحث المنافسين والموردين واتجاهات السوق                          |

⚠️ = الموصّل غير مربوط حاليًّا؛ أعِد ربطه من إعدادات Claude → Connectors ليعمل الوكيل.

الوكلاء المساعدون يقرؤون من Shopify فقط؛ أي كتابة في المتجر تمرّ عبر وكيل
`shopify` وبعد موافقتك.

</div>
