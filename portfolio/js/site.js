/* موقع إسلام رقام — النماذج، الخدمة الشهرية، الأسعار، ونموذج التواصل. */

/* ملاحظة: الروابط مطلقة لا نسبية، حتى تعمل الصفحة سواء فُتحت من
   GitHub Pages أو نُسخت وحدها إلى أي استضافة أخرى. */
const BASE = 'https://islamreggam62-max.github.io/Mon-.-premi-re.-Projets-';

const WORK = [
  {
    name: 'مدرسة النخبة',
    kind: 'مدرسة خاصة وروضة',
    href: BASE + '/demo-school/',
    hook: 'استمارة تسجيل تصل مباشرة، ورسوم معلنة بلا مكالمات',
    bits: ['أطوار', 'اليوم الدراسي', 'رسوم', 'تسجيل'],
    tone: 'a'
  },
  {
    name: 'دار الياسمين',
    kind: 'مطعم',
    href: BASE + '/demo-restaurant/',
    hook: 'قائمة بالأسعار وحجز طاولة من الهاتف',
    bits: ['قائمة', 'معرض', 'حجز طاولة', 'آراء'],
    tone: 'b'
  },
  {
    name: 'متجر نور',
    kind: 'محلّ ومتجر',
    href: BASE + '/',
    hook: 'عرض المنتجات بالأسعار وسلّة تعمل بالكامل',
    bits: ['منتجات', 'بحث', 'سلّة', 'طلب'],
    tone: 'c'
  }
];

const FLOW = [
  { t: 'تحديث المحتوى', d: 'القائمة، الأسعار، العروض، الأخبار — كلّما طلبتم، في اليوم نفسه.' },
  { t: 'جلسة تصوير شهرية', d: 'أحضر بالكاميرا كل شهر: أطباق، أنشطة، مرافق. لا صور من سنتين.' },
  { t: 'ثمانية منشورات', d: 'على إنستغرام وفيسبوك، مكتوبة ومجدولة — لا تُترك الصفحة تموت.' },
  { t: 'إدارة Google', d: 'المعلومات صحيحة، والتقييمات مُجاب عنها — لأنها تُقرأ قبل الزيارة.' },
  { t: 'تقرير آخر الشهر', d: 'كم زائرًا، من أين جاؤوا، وماذا بحثوا عنه. لتعرف على ماذا تدفع.' }
];

const PLANS = [
  {
    name: 'أساسية', month: '10 000', launch: '20 000',
    for: 'مؤسسة جديدة تريد الحضور أولًا',
    has: ['الموقع كاملًا', 'استضافة وصيانة', 'تحديثات كلّما طلبتم'],
    lacks: ['بلا نشر', 'بلا تصوير']
  },
  {
    name: 'متوسطة', month: '15 000', launch: '30 000',
    for: 'الاختيار الأكثر طلبًا',
    has: ['كل ما في الأساسية', '4 منشورات شهريًا', 'تصوير كل شهرين', 'إدارة Google'],
    lacks: [], best: true
  },
  {
    name: 'كاملة', month: '20 000', launch: '30 000',
    for: 'من يريد حضورًا لا يتوقّف',
    has: ['كل ما في المتوسطة', '8 منشورات شهريًا', 'جلسة تصوير كل شهر', 'تقرير مفصّل'],
    lacks: []
  }
];

const $ = (s, r = document) => r.querySelector(s);

/* ---------- النماذج ---------- */
$('#work-cards').replaceChildren(
  ...WORK.map((w) => {
    const a = document.createElement('a');
    a.className = 'card card--' + w.tone;
    a.href = w.href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `
      <span class="card__kind">${w.kind}</span>
      <span class="card__name">${w.name}</span>
      <span class="card__hook">${w.hook}</span>
      <span class="card__bits">${w.bits.map((b) => `<em>${b}</em>`).join('')}</span>
      <span class="card__go">افتح النموذج ↗</span>`;
    return a;
  })
);

/* ---------- الخدمة الشهرية: تسلسل حقيقي، لذلك رُقّم ---------- */
$('#flow').replaceChildren(
  ...FLOW.map((f) => {
    const li = document.createElement('li');
    li.innerHTML = `<h3>${f.t}</h3><p>${f.d}</p>`;
    return li;
  })
);

/* ---------- الأسعار ---------- */
$('#plans').replaceChildren(
  ...PLANS.map((p) => {
    const el = document.createElement('article');
    el.className = 'plan' + (p.best ? ' plan--best' : '');
    el.innerHTML = `
      ${p.best ? '<span class="plan__tag">الأكثر طلبًا</span>' : ''}
      <h3>${p.name}</h3>
      <p class="plan__for">${p.for}</p>
      <p class="plan__month"><strong>${p.month}</strong> دج <span>/ شهر</span></p>
      <p class="plan__launch">+ ${p.launch} دج رسوم إطلاق مرة واحدة</p>
      <ul>
        ${p.has.map((h) => `<li>${h}</li>`).join('')}
        ${p.lacks.map((l) => `<li class="no">${l}</li>`).join('')}
      </ul>`;
    return el;
  })
);

/* ---------- نموذج التواصل ---------- */
const form = $('#ask');
const MSG = {
  org:   'اكتب اسم المؤسسة.',
  field: 'اختر المجال.',
  phone: 'اكتب رقم هاتف صحيحًا (9 أرقام على الأقل).'
};

form.addEventListener('input', (e) => {
  const n = e.target.name;
  if (!MSG[n]) return;
  if (e.target.checkValidity() && e.target.value.trim() !== '') {
    $(`[data-er="${n}"]`, form).textContent = '';
    e.target.classList.remove('bad');
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  let first = null;
  Object.keys(MSG).forEach((n) => {
    const el = form.elements[n];
    const ok = el.checkValidity() && el.value.trim() !== '';
    $(`[data-er="${n}"]`, form).textContent = ok ? '' : MSG[n];
    el.classList.toggle('bad', !ok);
    el.setAttribute('aria-invalid', String(!ok));
    if (!ok && !first) first = el;
  });
  if (first) { first.focus(); return; }

  const d = new FormData(form);
  const text =
    `السلام عليكم، أنا من ${d.get('org')} (${d.get('field')}).\n` +
    `رقمي: ${d.get('phone')}\n` +
    (d.get('msg').trim() ? `ما يهمّني: ${d.get('msg').trim()}\n` : '') +
    `أريد أن أرى نموذجًا لمجالنا.`;

  // الرقم بصيغة دولية بلا رموز، كما يطلبه رابط wa.me
  window.open(`https://wa.me/213550000000?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
});

const y = $('[data-year]');
if (y) y.textContent = new Date().getFullYear();
