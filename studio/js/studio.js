/* الاستوديو: يبني موقعًا كاملًا من خمسة حقول، ويضع البيانات في الرابط نفسه
   حتى يعمل بلا خادم ولا قاعدة بيانات. */

const $ = (s, r = document) => r.querySelector(s);
const PRESETS = ['#b4531f', '#123b4a', '#7c2d8f', '#0f6b6b', '#1f6d3a', '#a8452a', '#1d3f8f', '#8a1538'];

/* ---------- ألوان ---------- */

function hexToHsl(hex) {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

/* لوحة كاملة مشتقّة من لون واحد: داكن للنصّ، فاتح جدًا للخلفيات */
function palette(hex) {
  const hsl = hexToHsl(hex) || hexToHsl('#b4531f');
  const cl = (v) => Math.max(0, Math.min(100, v));
  return {
    brand: `hsl(${hsl.h} ${cl(hsl.s)}% ${cl(hsl.l)}%)`,
    dark:  `hsl(${hsl.h} ${cl(hsl.s + 4)}% ${cl(hsl.l - 12)}%)`,
    deep:  `hsl(${hsl.h} ${cl(hsl.s + 10)}% ${cl(Math.min(hsl.l, 26))}%)`,
    soft:  `hsl(${hsl.h} ${cl(hsl.s - 25)}% 95%)`,
    line:  `hsl(${hsl.h} ${cl(hsl.s - 35)}% 88%)`,
    ink:   `hsl(${hsl.h} 14% 14%)`,
    muted: `hsl(${hsl.h} 8% 42%)`
  };
}

/* ---------- الحالة والرابط ---------- */

const FIELDS = ['name', 'sector', 'color', 'phone', 'addr', 'lead'];

function readState() {
  return {
    name:   $('#i-name').value.trim() || 'مؤسستك',
    sector: $('#i-sector').value,
    color:  $('#i-color').value,
    phone:  $('#i-phone').value.trim(),
    addr:   $('#i-addr').value.trim(),
    lead:   $('#i-lead').value.trim()
  };
}

function encodeState(st) {
  const p = new URLSearchParams();
  FIELDS.forEach((k) => { if (st[k]) p.set(k, st[k]); });
  return p.toString();
}

function decodeState(hash) {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  if (![...p.keys()].length) return null;
  const sector = SECTORS[p.get('sector')] ? p.get('sector') : 'resto';
  return {
    name:   p.get('name') || 'مؤسستك',
    sector,
    color:  /^#[\da-f]{6}$/i.test(p.get('color') || '') ? p.get('color') : SECTORS[sector].color,
    phone:  p.get('phone') || '',
    addr:   p.get('addr') || '',
    lead:   p.get('lead') || '',
    view:   p.get('v') === '1'
  };
}

/* ---------- بناء الموقع ---------- */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function buildSite(st) {
  const t = SECTORS[st.sector];
  const c = palette(st.color);
  const name = esc(st.name);
  const lead = esc(st.lead || t.lead);

  const style = `--b:${c.brand};--bd:${c.dark};--bp:${c.deep};--bs:${c.soft};--bl:${c.line};--ik:${c.ink};--mu:${c.muted}`;

  const feats = t.feats.map(([h, d]) => `
    <div class="d-feat"><h3>${esc(h)}</h3><p>${esc(d)}</p></div>`).join('');

  const list = t.list.map(([a, b]) => `
    <li><span>${esc(a)}</span><b>${esc(b)}</b></li>`).join('');

  const rows = t.rows ? `
    <section class="d-sec">
      <h2>${esc(t.rowsTitle)}</h2>
      <table class="d-tab"><tbody>
        ${t.rows.map(([a, b]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}
      </tbody></table>
    </section>` : '';

  const gallery = t.gallery ? `
    <section class="d-sec">
      <h2>من القاعة</h2>
      <div class="d-gal">${'<span></span>'.repeat(6)}</div>
    </section>` : '';

  return `
<div class="demo" style="${style}">
  <header class="d-top">
    <span class="d-mark">${esc(name.slice(0, 1))}</span>
    <span class="d-nm">${name}</span>
    <a class="d-call" href="tel:${esc(st.phone.replace(/\s/g, ''))}">اتصل</a>
  </header>

  <section class="d-hero">
    <p class="d-kick">${esc(t.tag)}</p>
    <h1>${esc(t.head.replace('{name}', st.name))}</h1>
    <p class="d-lead">${lead}</p>
    <a class="d-cta" href="#d-contact">${esc(t.cta)}</a>
  </section>

  <section class="d-feats">${feats}</section>

  <section class="d-sec">
    <h2>${esc(t.listTitle)}</h2>
    <ul class="d-list">${list}</ul>
  </section>

  ${rows}
  ${gallery}

  <section class="d-sec d-contact" id="d-contact">
    <h2>تواصل معنا</h2>
    <dl class="d-info">
      ${st.phone ? `<div><dt>الهاتف</dt><dd>${esc(st.phone)}</dd></div>` : ''}
      ${st.addr ? `<div><dt>العنوان</dt><dd>${esc(st.addr)}</dd></div>` : ''}
    </dl>
    <a class="d-cta d-cta--wide" href="tel:${esc(st.phone.replace(/\s/g, ''))}">${esc(t.cta)}</a>
  </section>

  <footer class="d-foot">© ${new Date().getFullYear()} ${name} — نموذج تجريبي</footer>
</div>`;
}

/* ---------- وضع العرض ---------- */

const incoming = decodeState(location.hash);

if (incoming && incoming.view) {
  document.title = incoming.name;
  $('#app').hidden = true;
  const full = $('#full');
  full.hidden = false;
  full.innerHTML = buildSite(incoming);
} else {
  initEditor(incoming);
}

/* ---------- وضع التحرير ---------- */

function initEditor(preset) {
  // قائمة المجالات
  $('#i-sector').replaceChildren(
    ...Object.entries(SECTORS).map(([k, v]) => {
      const o = document.createElement('option');
      o.value = k; o.textContent = v.label;
      return o;
    })
  );

  // ألوان جاهزة
  $('#i-swatches').replaceChildren(
    ...PRESETS.map((hex) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sw'; b.dataset.hex = hex;
      b.style.background = hex;
      b.setAttribute('aria-label', 'اللون ' + hex);
      return b;
    })
  );

  if (preset) {
    $('#i-name').value = preset.name;
    $('#i-sector').value = preset.sector;
    $('#i-color').value = preset.color;
    $('#i-phone').value = preset.phone;
    $('#i-addr').value = preset.addr;
    $('#i-lead').value = preset.lead;
  }

  const render = () => {
    const st = readState();
    $('#e-name').textContent = $('#i-name').value.trim() ? '' : 'اكتب اسم المؤسسة ليظهر في الموقع.';
    $('#preview').innerHTML = buildSite(st);
    markSwatch(st.color);
    // نُبقي الرابط محدَّثًا دون إضافة سجلّ تصفّح جديد مع كل حرف.
    // بعض السياقات المعزولة تمنع replaceState — ولا يضرّ ذلك، فزرّ النسخ
    // يبني الرابط من الحالة مباشرة لا من شريط العنوان.
    try { history.replaceState(null, '', '#' + encodeState(st)); } catch { /* تجاهل */ }
  };

  const markSwatch = (hex) => {
    document.querySelectorAll('.sw').forEach((b) => {
      b.classList.toggle('on', b.dataset.hex.toLowerCase() === hex.toLowerCase());
    });
  };

  ['i-name', 'i-phone', 'i-addr', 'i-lead'].forEach((id) =>
    $('#' + id).addEventListener('input', render));

  $('#i-color').addEventListener('input', render);

  // تغيير المجال يجلب لونه الافتراضي ما لم يكن المستخدم قد اختار لونًا بنفسه
  let colorTouched = Boolean(preset);
  $('#i-color').addEventListener('input', () => { colorTouched = true; });
  $('#i-swatches').addEventListener('click', (e) => {
    const b = e.target.closest('.sw');
    if (!b) return;
    colorTouched = true;
    $('#i-color').value = b.dataset.hex;
    render();
  });
  $('#i-sector').addEventListener('change', () => {
    if (!colorTouched) $('#i-color').value = SECTORS[$('#i-sector').value].color;
    render();
  });

  const linkFor = (st) => location.href.split('#')[0] + '#' + encodeState(st) + '&v=1';

  $('#b-open').addEventListener('click', () => {
    window.open(linkFor(readState()), '_blank', 'noopener');
  });

  $('#b-copy').addEventListener('click', async () => {
    const url = linkFor(readState());
    const tip = $('#tip');
    try {
      await navigator.clipboard.writeText(url);
      tip.textContent = 'نُسخ الرابط. الصقه في واتساب وأرسله.';
    } catch {
      // بعض المتصفّحات تمنع النسخ دون سياق آمن — نعرض الرابط ليُنسخ يدويًا
      tip.innerHTML = 'انسخ هذا الرابط يدويًا:<br><code class="tip__u"></code>';
      tip.querySelector('.tip__u').textContent = url;
    }
    tip.classList.add('tip--ok');
    setTimeout(() => tip.classList.remove('tip--ok'), 2500);
  });

  render();
}
