/* الدليل: يقرأ data.json ويعرضه مع بحث وتصفية وترتيب.
   لا خادم — ملف بيانات واحد يُحرَّر يدويًا. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const state = { q: '', area: '', cap: '', sort: 'name' };
let DATA = null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => `${Number(n).toLocaleString('fr-DZ')} دج`;

/* ---------- تحميل البيانات ---------- */

/* نسخة الملف الواحد تُعرّف البيانات مسبقًا؛ وإلا نجلب data.json */
if (window.__DIR_DATA) {
  DATA = window.__DIR_DATA;
  boot();
} else {
  loadData();
}

function loadData() {
  fetch('data.json')
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then((d) => { DATA = d; boot(); })
    .catch((err) => {
      console.error('تعذّر تحميل data.json:', err);
      $('#cards').innerHTML =
        '<p class="empty">تعذّر تحميل بيانات الدليل. إن فتحت الصفحة من القرص مباشرة، ' +
        'شغّلها عبر خادم محلّي بدل ذلك.</p>';
    });
}

/* ---------- التشغيل ---------- */

function boot() {
  const m = DATA.meta;
  document.title = `${m.title} — ${m.city}`;
  $('#t-title').textContent = m.title;
  $('#t-tag').textContent = m.tagline;
  $('#t-city').textContent = m.city;
  $('#t-owner').textContent = m.owner;
  $('#t-upd').textContent = m.updated;
  $('#t-upd').setAttribute('datetime', m.updated);
  $('#t-count').textContent = countLabel(DATA.places.length, 'قاعة');

  const msg = `السلام عليكم، أريد إضافة قاعتي إلى ${m.title}:\nالاسم:\nالحيّ:\nالسعة:\nالهاتف:`;
  $('#join-btn').href = `https://wa.me/${m.whatsapp}?text=${encodeURIComponent(msg)}`;

  buildChips('#f-area', DATA.filters.areas, 'area');
  buildChips('#f-cap', DATA.filters.capacities, 'cap');

  $('#q').addEventListener('input', debounce(() => { state.q = $('#q').value; render(); }, 150));
  $('#sort').addEventListener('change', () => { state.sort = $('#sort').value; render(); });
  $('#reset').addEventListener('click', () => {
    state.q = ''; state.area = ''; state.cap = ''; state.sort = 'name';
    $('#q').value = ''; $('#sort').value = 'name';
    syncChips(); render();
  });

  const y = $('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  render();
}

/* 1 مفرد، 2 مثنّى، 3–10 جمع، 11+ تمييز مفرد */
function countLabel(n, word) {
  const plural = { 'قاعة': 'قاعات' }[word] || word;
  if (n === 1) return `${word} واحدة`;
  if (n === 2) return `${word}ان`;
  return `${n} ${n % 100 >= 3 && n % 100 <= 10 ? plural : word}`;
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* ---------- شرائح التصفية ---------- */

function buildChips(sel, values, key) {
  const host = $(sel);
  host.replaceChildren(
    ...['الكلّ', ...values].map((v, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (i === 0 ? ' on' : '');
      b.textContent = v;
      b.dataset.val = i === 0 ? '' : v;
      b.dataset.key = key;
      b.setAttribute('aria-pressed', String(i === 0));
      return b;
    })
  );
  host.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state[key] = b.dataset.val;
    syncChips();
    render();
  });
}

function syncChips() {
  $$('.chip').forEach((b) => {
    const on = state[b.dataset.key] === b.dataset.val;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/* ---------- العرض ---------- */

function visible() {
  const q = state.q.trim().toLowerCase();
  const list = DATA.places.filter((p) =>
    (!state.area || p.area === state.area) &&
    (!state.cap || p.capacity === state.cap) &&
    (!q || p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q) ||
      (p.note || '').toLowerCase().includes(q))
  );

  const by = {
    name:         (a, b) => a.name.localeCompare(b.name, 'ar'),
    'price-asc':  (a, b) => a.from - b.from,
    'price-desc': (a, b) => b.from - a.from
  };
  return list.sort(by[state.sort] || by.name);
}

function card(p) {
  const tel = String(p.phone).replace(/\s/g, '');
  const el = document.createElement('article');
  el.className = 'c';
  el.style.setProperty('--h', p.hue ?? 260);
  el.innerHTML = `
    <div class="c__art" aria-hidden="true"></div>
    <div class="c__b">
      <h3>${esc(p.name)}</h3>
      <p class="c__meta">${esc(p.area)} <span class="dot">·</span> ${esc(p.capacity)} ضيف</p>
      ${p.note ? `<p class="c__note">${esc(p.note)}</p>` : ''}
      <p class="c__price">تبدأ من <strong>${money(p.from)}</strong></p>
      <div class="c__acts">
        <a class="btn btn--sm" href="tel:${esc(tel)}">${esc(p.phone)}</a>
        ${p.site
          ? `<a class="lnk" href="${esc(p.site)}" target="_blank" rel="noopener">الموقع ↗</a>`
          : '<span class="c__no">بلا موقع</span>'}
      </div>
    </div>`;
  return el;
}

function render() {
  const list = visible();
  $('#cards').replaceChildren(...list.map(card));
  $('#empty').hidden = list.length > 0;
  $('#t-res').textContent = list.length
    ? `${list.length} من أصل ${DATA.places.length}`
    : '';
}
