# ربط Claude بـ Facebook Messenger و Instagram

خادم ويب‑هوك مبني بـ **FastAPI** يستقبل الرسائل الواردة من **صفحة فيسبوك** و**حساب إنستغرام بيزنس**، يولّد الرد بـ **Claude API**، ثم يُرسله عبر **Meta Send API**.

```
مستخدم على Messenger / Instagram
        │  (يرسل رسالة)
        ▼
   Meta Webhook  ──POST /webhook──►  هذا الخادم (FastAPI)
                                        │ 1. التحقق من التوقيع
                                        │ 2. رد 200 فوراً
                                        │ 3. معالجة في الخلفية:
                                        │      history + النص ──► Claude API
                                        ▼
                                    Meta Send API ──► يصل الرد للمستخدم
```

## ما الذي ينجزه المشروع

- التحقق من الاشتراك (`GET /webhook`) الذي تطلبه Meta مرّة واحدة.
- التحقق من توقيع `X-Hub-Signature-256` في كل طلب وارد ورفض ما لا يطابق.
- الرد خلال ثوانٍ بـ `200` ثم توليد الجواب في الخلفية (Meta تعيد الإرسال إذا تأخّرت).
- منصّتان في نفس الكود: `object: "page"` ➜ Messenger، و`object: "instagram"` ➜ Instagram DM.
- ذاكرة محادثة لكل مستخدم (آخر 20 رسالة، تنتهي بعد 24 ساعة صمت).
- تجاهل تلقائي لـ: صدى رسائلنا (`is_echo`)، إشعارات التسليم والقراءة، والرسائل المكرّرة.
- تقسيم الردود الطويلة حسب حدود Send API (1900 حرف لـ Messenger، 950 لإنستغرام).
- مؤشّر «يكتب الآن…» (`typing_on`) قبل الرد.

## بنية الملفات

| الملف | الدور |
|---|---|
| `app/main.py` | تطبيق FastAPI ونقطتا `/webhook` (تحقّق + استقبال) |
| `app/security.py` | التحقّق من `X-Hub-Signature-256` |
| `app/handlers.py` | تحويل الـ payload إلى رسائل، ثم توليد الرد وإرساله |
| `app/claude_client.py` | نداء Claude API |
| `app/meta_client.py` | إرسال الردود عبر Send API |
| `app/store.py` | ذاكرة المحادثات ومنع تكرار الرسائل |
| `app/config.py` | الإعدادات من متغيّرات البيئة |
| `tests/` | 27 اختبار (توقيع، تحليل payload، منطق الرد، نقاط النهاية) |

## المتطلّبات قبل البدء

1. **تطبيق Meta** من [developers.facebook.com](https://developers.facebook.com) — النوع *Business*.
2. **صفحة فيسبوك** (Page) تملك صلاحية إدارتها.
3. **حساب إنستغرام Professional** (Business أو Creator) — يُفضّل ربطه بالصفحة، ومع تفعيل *Allow access to messages* في إعدادات الحساب.
4. **مفتاح Claude API** من [console.anthropic.com](https://console.anthropic.com).

## التشغيل محلياً

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

cp .env.example .env      # ثم املأ القيم
uvicorn app.main:app --reload --port 8000
```

اختبر أنّ الخادم يعمل:

```bash
curl http://localhost:8000/health          # {"status":"ok"}
```

Meta تتطلّب رابطاً عاماً بـ HTTPS، لذلك أثناء التطوير استعمل نفقاً:

```bash
ngrok http 8000        # خذ الرابط https://xxxx.ngrok-free.app
```

## إعداد الويب‑هوك في لوحة Meta

1. في تطبيقك: **Add Product ➜ Messenger** (ثم **Instagram** إذا أردت الـ DM أيضاً).
2. **Messenger ➜ Settings ➜ Access Tokens**: اربط صفحتك ثم ولّد **Page Access Token** وضعه في `FACEBOOK_PAGE_TOKEN`.
3. **App Settings ➜ Basic ➜ App Secret**: انسخه إلى `META_APP_SECRET`.
4. **Webhooks ➜ Add Callback URL**:
   - Callback URL: `https://xxxx.ngrok-free.app/webhook`
   - Verify Token: نفس قيمة `META_VERIFY_TOKEN` في ملف `.env`
   - اضغط **Verify and Save** — نقطة `GET /webhook` هي التي تردّ على هذا الطلب.
5. **Subscribe** للحقول: `messages` و`messaging_postbacks`، ثم اشترك بالصفحة (*Add subscriptions*).
6. لإنستغرام: في **Instagram ➜ Webhooks** اشترك بالحقل `messages` أيضاً.

### الصلاحيات المطلوبة

`pages_messaging` · `pages_manage_metadata` · `pages_show_list` · `instagram_basic` · `instagram_manage_messages`

في **وضع التطوير** يعمل البوت فوراً مع حسابات الأدمن والـ testers فقط. لفتحه للجمهور يلزم **App Review** من Meta.

### حالة إنستغرام بدون ربط بصفحة

إذا كان الحساب يستعمل **Instagram Login** (بدون Facebook Page)، ضع رمزه في `INSTAGRAM_TOKEN` — عندها تُرسَل ردود إنستغرام عبر `graph.instagram.com`. إذا تركته فارغاً، تُرسَل عبر `graph.facebook.com` برمز الصفحة.

## متغيّرات البيئة

| المتغيّر | الوصف |
|---|---|
| `META_VERIFY_TOKEN` | نص من اختيارك، نفسه في لوحة Meta |
| `META_APP_SECRET` | App Secret، يُستعمل للتحقّق من التوقيع |
| `FACEBOOK_PAGE_TOKEN` | Page Access Token لإرسال الردود |
| `INSTAGRAM_TOKEN` | اختياري، لحسابات Instagram Login فقط |
| `GRAPH_API_VERSION` | نسخة Graph API (افتراضياً `v21.0`) |
| `VERIFY_SIGNATURE` | `false` للاختبار المحلي فقط — أبقِها `true` في الإنتاج |
| `ANTHROPIC_API_KEY` | مفتاح Claude API |
| `CLAUDE_MODEL` | افتراضياً `claude-opus-5` |
| `CLAUDE_EFFORT` | `low` للسرعة، ارفعها لـ `medium`/`high` للأسئلة الأصعب |
| `CLAUDE_MAX_TOKENS` | الحد الأقصى لطول الرد |
| `HISTORY_MAX_MESSAGES` | عدد الرسائل المحفوظة لكل محادثة |
| `HISTORY_TTL_SECONDS` | مدّة الاحتفاظ بالمحادثة |

شخصية البوت ولهجته تُعدَّل من `system_prompt` في `app/config.py` (أو عبر متغيّر البيئة `SYSTEM_PROMPT`).

## الاختبارات

```bash
python3 -m pytest -q      # 27 passed
```

## النشر

أي منصّة تشغّل ASGI تكفي (Render، Railway، Fly.io، VPS مع systemd):

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

ضع نفس متغيّرات `.env` في إعدادات المنصّة، وحدّث Callback URL في لوحة Meta إلى الدومين الجديد.

## حدود وملاحظات

- **الذاكرة داخل العملية**: `ConversationStore` و`SeenMessages` في الرام. مع أكثر من worker واحد، كل عملية تحتفظ بنسختها — انقلهما إلى Redis قبل التوسّع.
- **نافذة 24 ساعة**: سياسة Meta تسمح بالرد المجاني خلال 24 ساعة من آخر رسالة للمستخدم؛ بعدها تلزم وسوم رسائل خاصة.
- **نص فقط**: الصور والملفات الصوتية تتلقّى رداً جاهزاً يطلب الكتابة. إضافة الرؤية ممكنة لاحقاً بتمرير الصورة إلى Claude.
- **الرفض**: عند رفض النموذج للطلب يُرجَع رد بديل مهذّب بدل رسالة خطأ، مع تفعيل `fallbacks` من جهة الخادم.
