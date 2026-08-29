/* نموذج موقع مدرسة خاصة وروضة — الأسئلة الشائعة، التنقّل، واستمارة التسجيل. */

const FAQ = [
  {
    q: 'هل تعتمدون البرنامج الوطني؟',
    a: 'نعم، البرنامج الوطني كاملًا ومعتمد من مديرية التربية. ما نضيفه فوقه: الإنجليزية من السنة الأولى ابتدائي، وحصّتان أسبوعيًا للورشات.'
  },
  {
    q: 'كم عدد التلاميذ في القسم؟',
    a: '18 تلميذًا كحدّ أقصى في الابتدائي والمتوسط، ومربّية واحدة لكل 8 أطفال في الروضة. لا نتجاوز هذا العدد مهما كان الطلب.'
  },
  {
    q: 'هل يمكنني زيارة المدرسة قبل التسجيل؟',
    a: 'بل نحن نفضّل ذلك. الزيارات من الأحد إلى الخميس بين 9:00 و15:00 بموعد مسبق، ويمكنك إحضار طفلك معك.'
  },
  {
    q: 'كيف تُدفع الرسوم؟',
    a: 'على ثلاثة أقساط: عند التسجيل، في جانفي، وفي أفريل. رسوم التسجيل الأوّلي 15 000 دج وتُخصم من القسط الأول.'
  },
  {
    q: 'هل يوجد نقل مدرسي؟',
    a: 'نعم، يغطّي حيدرة وبن عكنون والأبيار ودالي إبراهيم. الاشتراك السنوي 36 000 دج، والحافلات مرافَقة بمشرفة.'
  },
  {
    q: 'ماذا لو واجه طفلي صعوبة في مادة؟',
    a: 'يدخل تلقائيًا في حصص الدعم المدمجة داخل التوقيت، بلا رسوم إضافية. وإن استمرّت الصعوبة نستدعي الأولياء لوضع خطة متابعة فردية.'
  },
  {
    q: 'هل تقبلون التسجيل في منتصف السنة؟',
    a: 'نعم إن توفّر مقعد، بعد اختبار تحديد مستوى قصير. الرسوم تُحتسب حينها بالنسبة لما تبقّى من الموسم.'
  }
];

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- الأسئلة الشائعة ---------- */

const faqHost = $('#faq-list');

faqHost.replaceChildren(
  ...FAQ.map((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'faq__item';
    wrap.innerHTML = `
      <h3>
        <button type="button" class="faq__q" aria-expanded="false" aria-controls="faq-a-${index}">
          <span>${item.q}</span>
          <span class="faq__sign" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="faq__a" id="faq-a-${index}" hidden><p>${item.a}</p></div>`;
    return wrap;
  })
);

faqHost.addEventListener('click', (event) => {
  const button = event.target.closest('.faq__q');
  if (!button) return;
  const panel = $('#' + button.getAttribute('aria-controls'));
  const open = button.getAttribute('aria-expanded') === 'true';

  // سؤال واحد مفتوح في كل مرة
  $$('.faq__q', faqHost).forEach((other) => {
    other.setAttribute('aria-expanded', 'false');
    $('#' + other.getAttribute('aria-controls')).hidden = true;
  });
  if (!open) {
    button.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
  }
});

/* ---------- الرأس والتنقّل ---------- */

const header = $('#shead');
const nav = $('#snav');
const burger = $('.burger');

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (event) => {
  if (event.target.tagName === 'A') {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 30);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- ظهور تدريجي ---------- */

if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.1 }
  );
  $$('.section').forEach((section) => {
    section.classList.add('reveal');
    observer.observe(section);
  });
}

/* ---------- استمارة التسجيل ---------- */

const form = $('#reg-form');
const done = $('#reg-done');

// حدود منطقية لتاريخ الميلاد: من 2 إلى 16 سنة
const today = new Date();
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const birth = form.elements.birth;
birth.max = iso(new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()));
birth.min = iso(new Date(today.getFullYear() - 16, today.getMonth(), today.getDate()));

const MESSAGES = {
  parent: 'اكتب اسم ولي الأمر كاملًا (3 أحرف على الأقل).',
  phone:  'اكتب رقم هاتف صحيحًا (9 أرقام على الأقل).',
  child:  'اكتب اسم الطفل.',
  birth:  'اختر تاريخ ميلاد بين سنتين و16 سنة.',
  level:  'اختر الطور المطلوب.'
};

function validate() {
  let firstInvalid = null;
  Object.keys(MESSAGES).forEach((name) => {
    const input = form.elements[name];
    const slot = $(`[data-err="${name}"]`, form);
    const valid = input.checkValidity() && input.value.trim() !== '';
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
  const age = Math.floor((today - new Date(data.get('birth'))) / (365.25 * 24 * 3600 * 1000));
  // تمييز العدد في العربية: 1 مفرد، 2 مثنّى، 3–10 جمع، 11+ مفرد منصوب
  const ageLabel = age === 1 ? 'سنة واحدة'
    : age === 2 ? 'سنتان'
    : age <= 10 ? `${age} سنوات`
    : `${age} سنة`;

  $('#reg-id').textContent = 'NK-' + Date.now().toString(36).toUpperCase().slice(-6);
  $('#reg-summary').textContent =
    `شكرًا ${data.get('parent')}. سجّلنا طلب ${data.get('child')} (${ageLabel}) في ${data.get('level')}` +
    `${data.get('bus') === 'نعم' ? ' مع النقل المدرسي' : ''}. ` +
    `سنتصل بك على ${data.get('phone')} خلال 48 ساعة لتحديد موعد الزيارة.`;

  form.hidden = true;
  done.hidden = false;
  done.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

$('#reg-again').addEventListener('click', () => {
  form.reset();
  done.hidden = true;
  form.hidden = false;
  form.elements.parent.focus();
});

/* ---------- سنة التذييل ---------- */
const year = $('[data-year]');
if (year) year.textContent = new Date().getFullYear();
