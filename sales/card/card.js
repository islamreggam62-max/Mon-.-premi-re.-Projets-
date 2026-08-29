/* بطاقة العرض: تعبئة الحقول وتوليد كود QR، ثم الطباعة بقياس A5. */

const $ = (sel) => document.querySelector(sel);

/* نصّ مختلف لكل قطاع — بطاقة واحدة تخدم أربعة أسواق */
const SECTORS = {
  school: {
    head: 'موقع لمدرستك،<br>ومتابعة كل شهر',
    sub: 'لا موقع يُبنى ويُترك — بل حضور يتجدّد طوال الموسم.',
    list: [
      'استمارة تسجيل تصلكم مباشرة من هاتف ولي الأمر',
      'البرامج والرسوم والمرافق في صفحة واحدة واضحة',
      'تحديث الأخبار وتصوير الأنشطة شهريًا'
    ]
  },
  kg: {
    head: 'روضة جديدة؟<br>خلّي الأولياء يشوفوها',
    sub: 'لا أحد يترك طفله في مكان لم يره — أرِهم إيّاه.',
    list: [
      'صور القاعات والمربّيات وبرنامج اليوم بالساعة',
      'استمارة تسجيل تُملأ من البيت مساءً',
      'جلسة تصوير شهرية للأنشطة — لا صور قديمة'
    ]
  },
  resto: {
    head: 'مطعمك على الإنترنت،<br>وصور جديدة كل شهر',
    sub: 'الزبون يقرّر من هاتفه قبل أن يتحرّك من بيته.',
    list: [
      'القائمة كاملة بالأسعار، وحجز طاولة من الهاتف',
      'تصوير الأطباق ونشرها على إنستغرام شهريًا',
      'الردّ على تقييمات Google — لأنها تُقرأ قبل الزيارة'
    ]
  },
  clinic: {
    head: 'مواعيدك تُحجز<br>بلا رنين هاتف',
    sub: 'المريض يبحث عن أخصائي في حيّه — ويختار من يجد معلوماته.',
    list: [
      'التخصّص وأيام الاستقبال وساعات العمل بوضوح',
      'طلب موعد يصلكم بلا مكالمة تقطع الفحص',
      'العنوان والخريطة — نصف المكالمات سؤال عن الطريق'
    ]
  },
  hall: {
    head: 'قاعتك تُحجز<br>من الصور، لا من الكلام',
    sub: 'العروس تختار بعينها قبل أن تزور — أرِها القاعة كاملة.',
    list: [
      'معرض صور كامل لكل تهيئة من تهيئات القاعة',
      'التواريخ المتاحة وطلب حجز مباشر',
      'الصيغ والأسعار معلنة — فتوقف مكالمات السؤال عن الثمن'
    ]
  },
  gym: {
    head: 'برنامج الحصص<br>وأثمنة الاشتراك',
    sub: 'من يبحث عن قاعة يقارن التوقيت والثمن — لا شيء غيرهما.',
    list: [
      'جدول الحصص الأسبوعي محدَّثًا دائمًا',
      'صيغ الاشتراك وأثمنتها بلا غموض',
      'تسجيل أوّلي من الهاتف'
    ]
  },
  driving: {
    head: 'التسجيل في المدرسة<br>من الهاتف',
    sub: 'المترشّح يقارن الأثمنة والمدّة قبل أن يدخل أي مكتب.',
    list: [
      'الصيغ والأثمنة ومدّة التكوين بوضوح',
      'استمارة تسجيل مع الوثائق المطلوبة',
      'أوقات الحصص النظرية والتطبيقية'
    ]
  },
  market: {
    head: 'عروض الأسبوع<br>تصل الحيّ كلّه',
    sub: 'الورقة على الباب يراها من وصل — والصفحة تسبقه إلى بيته.',
    list: [
      'صفحة عروض تتجدّد كل أسبوع برابط واحد',
      'الفروع وساعات العمل بلا مكالمة',
      'رابط جاهز للنشر في ڨروبات الحيّ'
    ]
  }
};

/* ---------- كود QR ---------- */

let qr = null;

function drawQR(text) {
  const host = $('#qr');
  const fallback = $('#qr-fallback');

  // إن لم تُحمَّل المكتبة تبقى البطاقة صالحة: الرابط مكتوب تحتها دائمًا
  if (typeof QRious === 'undefined' || !text) {
    if (qr) { qr.canvas.remove(); qr = null; }
    fallback.hidden = false;
    return;
  }

  if (!qr) {
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    qr = new QRious({ element: canvas, size: 460, level: 'M', padding: 0, background: '#ffffff', foreground: '#12161a' });
  }
  qr.value = text;
  fallback.hidden = true;
}

/* ---------- التحديث ---------- */

function render() {
  const sector = SECTORS[$('#sector').value];
  const link = $('#link').value.trim();

  $('#c-name').textContent  = $('#name').value.trim()  || 'اسمك';
  $('#c-phone').textContent = $('#phone').value.trim() || 'رقم هاتفك';
  $('#c-price').textContent = $('#price').value.trim();

  $('#c-head').innerHTML = sector.head;
  $('#c-sub').textContent = sector.sub;
  $('#c-list').replaceChildren(
    ...sector.list.map((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    })
  );

  // نعرض الرابط بلا بادئة البروتوكول: أقصر وأسهل على العين المطبوعة
  $('#c-link').textContent = link.replace(/^https?:\/\//, '') || 'ضع رابط النموذج';
  drawQR(link);
}

['sector', 'name', 'phone', 'link', 'price'].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener('input', render);
  el.addEventListener('change', render);
});

$('#print').addEventListener('click', () => window.print());

render();
