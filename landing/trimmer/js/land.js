/* صفحة هبوط: ماكينة تشذيب شعر الأنف والأذن.
   كل ما يُعدَّل عادةً موجود في CONFIG أعلى الملف. */

const CONFIG = {
  phone: '0770 98 36 38',
  wa: '213770983638',      // نفس الرقم بالصيغة الدولية بلا صفر
  price: 2500,             // سعر القطعة الواحدة
  priceWas: 3500,          // السعر قبل التخفيض — اجعله 0 لإخفائه
  bulk: { 2: 4500, 3: 6300 } // أسعار العرض للكميات
};

const FEATS = [
  ['بلا ألم وبلا جروح', 'الشفرة داخل غطاء واقٍ لا يلمس الجلد — لا نتف ولا مقصّ قرب العين.'],
  ['شفرة دوّارة 360°', 'تصل إلى الشعر من كل الجهات، فتنتهي في أقلّ من دقيقة.'],
  ['ضوء أثناء العمل', 'مؤشّر مضيء يبيّن لك أن الجهاز يشتغل وأين تمرّره.'],
  ['للأنف والأذن معًا', 'ويصلح كذلك لتهذيب حواف اللحية والشارب.'],
  ['رأس يُغسل بالماء', 'ينفصل الرأس فتغسله وتجفّفه — نظافة كاملة بعد كل مرة.'],
  ['يدخل الجيب', 'حجم صغير مع علبة حفظ، يرافقك في السفر والعمل.']
];

const STEPS = [
  ['نظّف الأنف أوّلًا', 'امسح المنطقة وجفّفها. الشعر الجافّ يُقصّ أنظف من المبلّل.'],
  ['شغّل ثم أدخل بلطف', 'شغّل الجهاز قبل الإدخال، وأدخل الرأس بضعة ملّيمترات فقط.'],
  ['أدر ببطء ثم نظّف', 'حرّكه دورة أو دورتين، أطفئه، ثم اغسل الرأس بالماء وجفّفه.']
];

const REVS = [
  ['كنت نستعمل المقص ونجرح روحي كل مرة. هذي أنظف بزاف وما توجعش.', 'ياسين ب.', 'الجزائر'],
  ['خفيفة وتدخل الجيب. وصلاتني في يومين والخلاص عند الاستلام كيما قالوا.', 'كريم م.', 'وهران'],
  ['شريتها لخويا وعجباتو، رجعت شريت وحدة أخرى لبابا.', 'سفيان ح.', 'قسنطينة']
];

const FAQ = [
  ['كيفاش نخلّص؟', 'الدفع عند الاستلام: تدفع لعامل التوصيل بعد ما تشوف المنتج وتجرّبه. ما تخلّصش والو قبل.'],
  ['شحال يدوم التوصيل؟', 'من 2 إلى 5 أيام حسب الولاية. نتصلو بيك قبل الإرسال باش نأكّدو معاك.'],
  ['واش نقدر نرجّعها؟', 'إلا شفتها وما عجباتكش عند التوصيل، ما تاخذهاش وما تخلّصش. وإلا وصلاتك خايبة، عيّط لنا ونبدّلوهالك.'],
  ['واش توجع؟', 'لا. الشفرة راهي داخل غطاء واقي ما يمسّش الجلد — تقصّ الشعر برك.'],
  ['تخدم بالبطارية ولا بالشحن؟', 'راجع المكتوب على العلبة عندك وبدّل هاد الجواب — ما نعطوش معلومة ما راناش متأكدين منها.'],
  ['واش نقدر نغسلها؟', 'الرأس ينفصل ويتغسل بالماء. أما الجسم فامسحو بقطعة رطبة برك، ما تغطّسوش فالماء.']
];

const WILAYAS = ['أدرار','الشلف','الأغواط','أم البواقي','باتنة','بجاية','بسكرة','بشار','البليدة','البويرة','تمنراست','تبسة','تلمسان','تيارت','تيزي وزو','الجزائر','الجلفة','جيجل','سطيف','سعيدة','سكيكدة','سيدي بلعباس','عنابة','قالمة','قسنطينة','المدية','مستغانم','المسيلة','معسكر','ورقلة','وهران','البيض','إليزي','برج بوعريريج','بومرداس','الطارف','تندوف','تيسمسيلت','الوادي','خنشلة','سوق أهراس','تيبازة','ميلة','عين الدفلى','النعامة','عين تموشنت','غرداية','غليزان','تيميمون','برج باجي مختار','أولاد جلال','بني عباس','عين صالح','عين قزام','تقرت','جانت','المغير','المنيعة'];

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const dz = (n) => `${Number(n).toLocaleString('fr-DZ')} دج`;

/* ---------- الأسعار ---------- */

function priceFor(qty) {
  return CONFIG.bulk[qty] || CONFIG.price * qty;
}

$('#p-now').textContent = dz(CONFIG.price);
if (CONFIG.priceWas > CONFIG.price) {
  $('#p-was').textContent = dz(CONFIG.priceWas);
  $('.price__cut').textContent = `وفّر ${dz(CONFIG.priceWas - CONFIG.price)}`;
} else {
  $('#p-was').hidden = true;
  $('.price__cut').hidden = true;
}

/* ---------- الأقسام ---------- */

$('#feats').replaceChildren(...FEATS.map(([t, d]) => {
  const el = document.createElement('div');
  el.className = 'feat';
  el.innerHTML = `<h3>${t}</h3><p>${d}</p>`;
  return el;
}));

$('#steps').replaceChildren(...STEPS.map(([t, d]) => {
  const li = document.createElement('li');
  li.innerHTML = `<h3>${t}</h3><p>${d}</p>`;
  return li;
}));

$('#revs').replaceChildren(...REVS.map(([q, who, where]) => {
  const el = document.createElement('blockquote');
  el.innerHTML = `<p>«${q}»</p><footer><strong>${who}</strong><span>${where}</span></footer>`;
  return el;
}));

$('#faq').replaceChildren(...FAQ.map(([q, a], i) => {
  const d = document.createElement('div');
  d.className = 'qa';
  d.innerHTML = `
    <h3><button type="button" class="qa__q" aria-expanded="false" aria-controls="qa-${i}">
      <span>${q}</span><span class="qa__s" aria-hidden="true"></span></button></h3>
    <div class="qa__a" id="qa-${i}" hidden><p>${a}</p></div>`;
  return d;
}));

$('#faq').addEventListener('click', (e) => {
  const b = e.target.closest('.qa__q');
  if (!b) return;
  const panel = $('#' + b.getAttribute('aria-controls'));
  const open = b.getAttribute('aria-expanded') === 'true';
  $$('.qa__q').forEach((o) => {
    o.setAttribute('aria-expanded', 'false');
    $('#' + o.getAttribute('aria-controls')).hidden = true;
  });
  if (!open) { b.setAttribute('aria-expanded', 'true'); panel.hidden = false; }
});

/* ---------- الولايات والمجموع ---------- */

const sel = $('#wilaya');
WILAYAS.forEach((w, i) => {
  const o = document.createElement('option');
  o.value = w;
  o.textContent = `${String(i + 1).padStart(2, '0')} — ${w}`;
  sel.appendChild(o);
});

const qty = $('#qty');
[[2, 4500], [3, 6300]].forEach(([n]) => {
  const o = [...qty.options].find((x) => x.value === String(n));
  if (o) o.textContent += ` (${dz(priceFor(n))})`;
});

function updateTotal() {
  const n = Number(qty.value) || 1;
  $('#total').innerHTML = `المجموع: <strong>${dz(priceFor(n))}</strong> + التوصيل`;
}
qty.addEventListener('change', updateTotal);
updateTotal();

/* ---------- النموذج ---------- */

const frm = $('#frm');
const MSG = {
  name:   'اكتب اسمك الكامل.',
  phone:  'اكتب رقم هاتف صحيحًا يبدأ بصفر.',
  wilaya: 'اختر ولايتك.',
  addr:   'اكتب البلدية أو العنوان.'
};

frm.addEventListener('input', (e) => {
  const n = e.target.name;
  if (!MSG[n]) return;
  if (e.target.checkValidity() && e.target.value.trim() !== '') {
    $(`[data-e="${n}"]`, frm).textContent = '';
    e.target.classList.remove('bad');
  }
});

frm.addEventListener('submit', (e) => {
  e.preventDefault();

  let first = null;
  Object.keys(MSG).forEach((n) => {
    const el = frm.elements[n];
    const ok = el.checkValidity() && el.value.trim() !== '';
    $(`[data-e="${n}"]`, frm).textContent = ok ? '' : MSG[n];
    el.classList.toggle('bad', !ok);
    el.setAttribute('aria-invalid', String(!ok));
    if (!ok && !first) first = el;
  });
  if (first) { first.focus(); return; }

  const d = new FormData(frm);
  const n = Number(d.get('qty')) || 1;
  const text =
    `طلب جديد — ماكينة تشذيب شعر الأنف والأذن\n` +
    `الاسم: ${d.get('name')}\n` +
    `الهاتف: ${d.get('phone')}\n` +
    `الولاية: ${d.get('wilaya')}\n` +
    `العنوان: ${d.get('addr')}\n` +
    `الكمية: ${n}\n` +
    `المجموع: ${dz(priceFor(n))} + التوصيل`;

  window.open(`https://wa.me/${CONFIG.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
});

const y = $('[data-year]');
if (y) y.textContent = new Date().getFullYear();
