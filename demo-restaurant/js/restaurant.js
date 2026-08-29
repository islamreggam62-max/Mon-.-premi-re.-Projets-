/* نموذج موقع مطعم — القائمة، التنقّل، ونموذج الحجز. */

const MENU = {
  starters: [
    { name: 'بريوات بالجبن والسبانخ', price: 90,  desc: 'عجين مقرمش، جبن ماعز طري، سبانخ من الموسم.', tag: 'نباتي' },
    { name: 'زعلوك مدخّن',            price: 70,  desc: 'باذنجان مشوي على الحطب، طماطم، كمّون وزيت الضيعة.', tag: 'نباتي' },
    { name: 'شربة الحوت',              price: 110, desc: 'مرق سمك صافٍ، زعفران، خبز محمّص بالثوم.', tag: '' },
    { name: 'سلطة البرتقال والزيتون',  price: 65,  desc: 'برتقال دم، زيتون بلدي، ماء الزهر.', tag: 'خالٍ من الغلوتين' }
  ],
  mains: [
    { name: 'طنجية مراكشية',           price: 240, desc: 'لحم بقري في فخّار، ثماني ساعات في فرن الحمّام.', tag: 'طبق الدار' },
    { name: 'سمك الشرمولة',            price: 260, desc: 'سمك اليوم، شرمولة خضراء، بطاطس مقرمشة.', tag: '' },
    { name: 'ضلع ضأن بالبرقوق',        price: 320, desc: 'ضأن مطهو ببطء، برقوق، لوز محمّص وقرفة.', tag: '' },
    { name: 'كسكس الخضر السبعة',       price: 180, desc: 'سميد يدوي، سبع خضر موسمية، مرق خفيف.', tag: 'نباتي' },
    { name: 'دجاج بالحامض المصبَّر',   price: 195, desc: 'دجاج بلدي، ليمون مصبَّر، زيتون مسلّح.', tag: '' },
    { name: 'ريزوتو الزعفران والقرع',  price: 170, desc: 'أرز كارنارولي، زعفران تالوين، قرع محمّص.', tag: 'نباتي' }
  ],
  desserts: [
    { name: 'كعب الغزال بالماء الزهر', price: 75,  desc: 'لوز مطحون يدويًا، عجين رقيق، ماء الزهر.', tag: '' },
    { name: 'مهلبية الأركان',          price: 85,  desc: 'كريمة أركان، عسل الدغموس، لوز مملّح.', tag: 'خالٍ من الغلوتين' },
    { name: 'بسطيلة الحلوى',           price: 95,  desc: 'ورقة رقيقة، كريمة قرفة، فواكه جافة.', tag: '' }
  ],
  drinks: [
    { name: 'أتاي بالنعناع',            price: 40,  desc: 'شاي أخضر، نعناع طازج، يُصبّ على الطاولة.', tag: '' },
    { name: 'عصير الرمّان الطازج',      price: 55,  desc: 'رمّان الموسم، يُعصر عند الطلب.', tag: '' },
    { name: 'قهوة عربية بالهيل',        price: 45,  desc: 'حبّ محمّص في الدار، هيل أخضر.', tag: '' },
    { name: 'ليموناضة ماء الزهر',       price: 50,  desc: 'ليمون بلدي، ماء الزهر، نعناع.', tag: '' }
  ]
};

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- القائمة ---------- */

const grid = $('#menu-grid');

function renderMenu(section) {
  grid.replaceChildren(
    ...MENU[section].map((item) => {
      const el = document.createElement('article');
      el.className = 'dish';
      el.innerHTML = `
        <div class="dish__top">
          <h3>${item.name}</h3>
          <span class="dish__dots" aria-hidden="true"></span>
          <span class="dish__price">${item.price} د.م</span>
        </div>
        <p>${item.desc}</p>
        ${item.tag ? `<span class="dish__tag">${item.tag}</span>` : ''}`;
      return el;
    })
  );
}

$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((other) => {
      other.classList.toggle('is-active', other === tab);
      other.setAttribute('aria-selected', String(other === tab));
    });
    renderMenu(tab.dataset.tab);
  });
});

renderMenu('starters');

/* ---------- رأس الصفحة والتنقّل ---------- */

const header = $('#rheader');
const nav = $('#rnav');
const burger = $('.burger');

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
});

// إغلاق القائمة بعد اختيار رابط على الجوّال
nav.addEventListener('click', (event) => {
  if (event.target.tagName === 'A') {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- ظهور تدريجي للأقسام ---------- */

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.12 }
  );
  $$('.section, .facts').forEach((section) => {
    section.classList.add('reveal');
    observer.observe(section);
  });
}

/* ---------- نموذج الحجز ---------- */

const form = $('#booking-form');
const done = $('#booking-done');

// لا نسمح بحجز تاريخ ماضٍ
const dateInput = form.elements.date;
const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const isoToday = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
dateInput.min = isoToday;
dateInput.value = isoToday;

const MESSAGES = {
  name:   'اكتب اسمك الكامل (3 أحرف على الأقل).',
  phone:  'اكتب رقم هاتف صحيحًا (8 أرقام على الأقل).',
  date:   'اختر تاريخًا من اليوم فصاعدًا.',
  time:   'اختر وقت الحجز.',
  guests: 'اختر عدد الأشخاص.'
};

function validate() {
  let firstInvalid = null;
  Object.keys(MESSAGES).forEach((name) => {
    const input = form.elements[name];
    const slot = $(`[data-err="${name}"]`, form);
    let valid = input.checkValidity() && input.value.trim() !== '';
    if (name === 'date' && valid && input.value < isoToday) valid = false;

    slot.textContent = valid ? '' : MESSAGES[name];
    input.classList.toggle('is-bad', !valid);
    input.setAttribute('aria-invalid', String(!valid));
    if (!valid && !firstInvalid) firstInvalid = input;
  });
  return firstInvalid;
}

form.addEventListener('input', (event) => {
  const name = event.target.name;
  if (!MESSAGES[name]) return;
  if (event.target.checkValidity() && event.target.value.trim() !== '') {
    $(`[data-err="${name}"]`, form).textContent = '';
    event.target.classList.remove('is-bad');
    event.target.setAttribute('aria-invalid', 'false');
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const invalid = validate();
  if (invalid) {
    invalid.focus();
    return;
  }

  const data = new FormData(form);
  const guests = Number(data.get('guests'));
  // حرف الجر داخل العبارة: «لشخصين» تُوصل، بينما «لـ 4 أشخاص» تُفصل عن الرقم
  const people = guests === 1 ? 'لشخص واحد' : guests === 2 ? 'لشخصين' : `لـ ${guests} أشخاص`;
  const dateLabel = new Date(data.get('date')).toLocaleDateString('ar-MA', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  $('#booking-summary').textContent =
    `شكرًا ${data.get('name')}. طاولة ${people} يوم ${dateLabel} على الساعة ${data.get('time')}. ` +
    `سنؤكّد الحجز برسالة على ${data.get('phone')}.`;

  form.hidden = true;
  done.hidden = false;
  done.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('#booking-again').addEventListener('click', () => {
  form.reset();
  dateInput.value = isoToday;
  done.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});

/* ---------- سنة التذييل ---------- */
const year = $('[data-year]');
if (year) year.textContent = new Date().getFullYear();
