import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, parseFrontMatter, escapeHtml } from './lib/md.js';
import { layout, breadcrumb } from './lib/layout.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(root, 'public');
const CONTENT = path.join(root, 'content');
const checkOnly = process.argv.includes('--check');

const read = (p) => fs.readFileSync(p, 'utf8');
const site = JSON.parse(read(path.join(CONTENT, 'site.json')));
const warnings = [];

function write(routePath, html) {
  const dir = path.join(OUT, routePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

function loadDir(dir) {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { meta, body } = parseFrontMatter(read(path.join(full, f)));
      if (!meta.slug) warnings.push(`${dir}/${f}: ناقص slug في الـ front-matter`);
      if (!meta.title) warnings.push(`${dir}/${f}: ناقص title في الـ front-matter`);
      const rendered = renderMarkdown(body);
      return { ...meta, file: `${dir}/${f}`, body, ...rendered };
    })
    .sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
}

const guides = loadDir('guides');
const models = loadDir('namadhij');
const faq = JSON.parse(read(path.join(CONTENT, 'faq.json')));
const dalil = JSON.parse(read(path.join(CONTENT, 'dalil.json')));

const urls = [];
const page = (p, title, description, bodyHtml, extra = {}) => {
  urls.push({ loc: p, priority: extra.priority || 0.7 });
  write(p === '/' ? '.' : p.replace(/^\/|\/$/g, ''), layout(site, { path: p, title, description, ...extra }, bodyHtml, extra));
};

const md = (s) => renderMarkdown(s).html;

const revisionBanner = (item) =>
  item.revision === 'verified'
    ? ''
    : `<div class="revision-flag" role="note"><strong>محتوى في طور المراجعة القانونية.</strong> المراجع المذكورة هنا لازم تتأكّدي منها في النصّ الرسمي المنشور في الجريدة الرسمية أو مع مختصّ قبل ما تبني عليها قرار.</div>`;

/* ---------- الصفحة الرئيسية ---------- */
const heroCards = guides
  .map(
    (g) => `<a class="card${g.urgent ? ' card--urgent' : ''}" href="/adilla/${g.slug}/">
      <span class="card__icon" aria-hidden="true">${g.icon || '📄'}</span>
      <span class="card__body"><b>${escapeHtml(g.title)}</b><small>${escapeHtml(g.description || '')}</small></span>
    </a>`
  )
  .join('');

page(
  '/',
  site.name,
  site.description,
  `<section class="hero">
    <div class="wrap">
      <h1>حقوقك مكتوبة في القانون.<br>هنا نشرحوهملك بالدارجة.</h1>
      <p class="lede">الطلاق، النفقة، الحضانة، السكن، الميراث، وحقوق العاملة — شرح مبسّط، نماذج جاهزة تعمّريها، ودليل يقولك وين تروحي وواش تجيبي معاك.</p>
      <div class="hero-actions">
        <a class="btn btn--primary" href="/adilla/">ابداي بالأدلة</a>
        <a class="btn" href="/namadhij/">النماذج الجاهزة</a>
      </div>
    </div>
  </section>

  <section class="wrap section">
    <h2>الأدلة</h2>
    <div class="cards">${heroCards}</div>
  </section>

  <section class="wrap section">
    <h2>ثلاث قواعد تنفعك في أي ملف</h2>
    <div class="pillars">
      <div class="pillar"><b>1. وثّقي في نفس اليوم</b><p>الشهادة الطبية، محضر الشرطة، الصور المؤرّخة. الوثيقة اللي ما دِرتيهاش ساعتها، صعيب تعوّضيها بعد شهر.</p></div>
      <div class="pillar"><b>2. اطلبي كل شيء مكتوب في العريضة</b><p>القاضي ما يحكمش بحاجة ما طُلِبَتش. الحضانة، النفقة، السكن، التعويض، حقّ الزيارة — كلّهم بنود منفصلة.</p></div>
      <div class="pillar"><b>3. الحكم بلا تنفيذ ورقة</b><p>نسخة تنفيذية، تبليغ رسمي، محضر عدم تنفيذ. هاذي الوثائق هي اللي تحوّل الحكم لفلوس في يدّك.</p></div>
    </div>
  </section>

  <section class="wrap section">
    <div class="split">
      <div>
        <h2>نماذج جاهزة</h2>
        <p class="muted">عرائض وشكاوى مكتوبة بالصيغة القانونية، ما عليك غير تعمّري الخانات وتطبعي.</p>
        <ul class="linklist">${models.map((m) => `<li><a href="/namadhij/${m.slug}/">${escapeHtml(m.title)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h2>وين تروحي</h2>
        <p class="muted">المحاكم، مكتب المساعدة القضائية، مفتشية العمل، CNAS، والجمعيات — مع الوثائق المطلوبة في كل جهة.</p>
        <p><a class="btn" href="/dalil/">دليل الجهات</a> <a class="btn" href="/asila/">أسئلة وأجوبة</a></p>
      </div>
    </div>
  </section>

  <section class="wrap section">
    <div class="disclaimer-box">
      <h2>باش نكونو واضحين</h2>
      <p>${escapeHtml(site.disclaimer)}</p>
    </div>
  </section>`,
  {
    priority: 1.0,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: site.baseUrl,
      inLanguage: 'ar-DZ',
      description: site.description,
    },
  }
);

/* ---------- فهرس الأدلة ---------- */
page(
  '/adilla/',
  'الأدلة',
  'كل الأدلة القانونية بالدارجة: الطلاق، النفقة، الحضانة، السكن، الميراث، حقوق العاملة، والعنف الزوجي.',
  breadcrumb([{ label: 'الرئيسية', path: '/' }, { label: 'الأدلة' }]) +
    `<div class="wrap section">
      <h1>الأدلة</h1>
      <p class="lede">كل دليل يشرحلك الحقّ، المرجع القانوني، الخطوات العملية، والأخطاء اللي تخسّرك.</p>
      <div class="cards">${heroCards}</div>
    </div>`,
  { priority: 0.9 }
);

/* ---------- صفحات الأدلة ---------- */
for (const g of guides) {
  const toc = g.headings.length
    ? `<nav class="toc" aria-label="محتويات الصفحة"><b>في هاذ الصفحة</b><ul>${g.headings
        .map((h) => `<li><a href="#${h.id}">${h.text}</a></li>`)
        .join('')}</ul></nav>`
    : '';
  const related = models.filter((m) => m.guide === g.slug);
  const relatedHtml = related.length
    ? `<aside class="related"><b>نماذج تخدم مع هاذ الدليل</b><ul>${related
        .map((m) => `<li><a href="/namadhij/${m.slug}/">${escapeHtml(m.title)}</a></li>`)
        .join('')}</ul></aside>`
    : '';

  page(
    `/adilla/${g.slug}/`,
    g.title,
    g.description,
    breadcrumb([
      { label: 'الرئيسية', path: '/' },
      { label: 'الأدلة', path: '/adilla/' },
      { label: g.category || 'دليل' },
    ]) +
      `<article class="wrap article">
        <header class="article__head">
          <p class="eyebrow">${escapeHtml(g.category || '')}</p>
          <h1>${escapeHtml(g.title)}</h1>
          <p class="lede">${escapeHtml(g.description || '')}</p>
          <p class="meta">آخر تحديث: ${escapeHtml(String(g.updated || ''))}</p>
        </header>
        ${revisionBanner(g)}
        ${toc}
        <div class="prose">${g.html}</div>
        ${relatedHtml}
        <p class="article__foot">${escapeHtml(site.disclaimer)}</p>
      </article>`,
    {
      priority: 0.9,
      ogType: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: g.title,
        description: g.description,
        inLanguage: 'ar-DZ',
        datePublished: String(g.updated || ''),
        publisher: { '@type': 'Organization', name: site.name },
      },
    }
  );
}

/* ---------- فهرس النماذج ---------- */
page(
  '/namadhij/',
  'النماذج الجاهزة',
  'عرائض وشكاوى وطلبات جاهزة بالصيغة القانونية — تعمّريها وتطبعيها.',
  breadcrumb([{ label: 'الرئيسية', path: '/' }, { label: 'النماذج' }]) +
    `<div class="wrap section">
      <h1>النماذج الجاهزة</h1>
      <p class="lede">كل نموذج مكتوب بالصيغة اللي تتقبّل في المحكمة، مع قائمة الوثائق المرفقة والأخطاء اللي تسقّط الملف. الخانات الملوّنة تعمّريها أنتِ.</p>
      <div class="cards">${models
        .map(
          (m) => `<a class="card" href="/namadhij/${m.slug}/">
            <span class="card__icon" aria-hidden="true">📝</span>
            <span class="card__body"><b>${escapeHtml(m.title)}</b><small>${escapeHtml(m.description || '')}</small></span>
          </a>`
        )
        .join('')}</div>
    </div>`,
  { priority: 0.9 }
);

/* ---------- صفحات النماذج ---------- */
for (const m of models) {
  const guide = guides.find((g) => g.slug === m.guide);
  page(
    `/namadhij/${m.slug}/`,
    m.title,
    m.description,
    breadcrumb([
      { label: 'الرئيسية', path: '/' },
      { label: 'النماذج', path: '/namadhij/' },
      { label: m.category || 'نموذج' },
    ]) +
      `<article class="wrap article article--model">
        <header class="article__head">
          <p class="eyebrow">نموذج جاهز — ${escapeHtml(m.category || '')}</p>
          <h1>${escapeHtml(m.title)}</h1>
          <p class="lede">${escapeHtml(m.description || '')}</p>
          <div class="model-actions no-print">
            <button type="button" class="btn btn--primary" data-print>طبع النموذج</button>
            ${guide ? `<a class="btn" href="/adilla/${guide.slug}/">اقراي الدليل الأول</a>` : ''}
          </div>
        </header>
        ${revisionBanner(m)}
        <div class="prose prose--model">${m.html}</div>
        <p class="article__foot">${escapeHtml(site.disclaimer)}</p>
      </article>`,
    { priority: 0.8, ogType: 'article' }
  );
}

/* ---------- دليل الجهات ---------- */
page(
  '/dalil/',
  dalil.title,
  dalil.description,
  breadcrumb([{ label: 'الرئيسية', path: '/' }, { label: 'دليل الجهات' }]) +
    `<div class="wrap section">
      <h1>${escapeHtml(dalil.title)}</h1>
      <p class="lede">${escapeHtml(dalil.description)}</p>
      ${md(dalil.intro)}

      <div class="emergency no-print">
        <b>أرقام الاستعجال</b>
        <ul>${site.emergency
          .map((e) => `<li><span>${escapeHtml(e.label)}</span> <a href="tel:${e.number}">${escapeHtml(e.number)}</a>${e.verified ? '' : ' <em class="unverified">قيد التأكيد</em>'}</li>`)
          .join('')}</ul>
        <p class="muted small">الأرقام تتغيّر — تأكّدي منها محلّياً. في حالة خطر مباشر، اتصلي بأقرب مركز أمن.</p>
      </div>

      <h2>${escapeHtml(dalil.typesTitle)}</h2>
      <div class="orgs">
        ${dalil.types
          .map(
            (t) => `<section class="org">
              <h3>${escapeHtml(t.name)}</h3>
              <p class="org__what">${md(t.what).replace(/^<p>|<\/p>$/g, '')}</p>
              <p><b>كيفاش:</b> ${md(t.how).replace(/^<p>|<\/p>$/g, '')}</p>
              <p><b>الوثائق:</b> ${md(t.docs).replace(/^<p>|<\/p>$/g, '')}</p>
            </section>`
          )
          .join('')}
      </div>

      <div class="callout callout--note"><p class="callout__title">الأرقام حسب الولاية</p>${md(dalil.wilayasNote)}</div>
    </div>`,
  { priority: 0.8 }
);

/* ---------- أسئلة وأجوبة ---------- */
const faqItems = faq.groups.flatMap((g) => g.items);
page(
  '/asila/',
  faq.title,
  faq.description,
  breadcrumb([{ label: 'الرئيسية', path: '/' }, { label: 'أسئلة وأجوبة' }]) +
    `<div class="wrap section">
      <h1>${escapeHtml(faq.title)}</h1>
      <p class="lede">${escapeHtml(faq.description)}</p>
      ${faq.groups
        .map(
          (g) => `<section class="faq-group">
            <h2 id="${escapeHtml(g.name)}">${escapeHtml(g.name)}</h2>
            ${g.items
              .map(
                (it) => `<details class="qa"><summary>${escapeHtml(it.q)}</summary><div class="qa__a">${md(it.a)}</div></details>`
              )
              .join('')}
          </section>`
        )
        .join('')}
    </div>`,
  {
    priority: 0.8,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'ar-DZ',
      mainEntity: faqItems.map((it) => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: { '@type': 'Answer', text: it.a.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') },
      })),
    },
  }
);

/* ---------- على الموقع ---------- */
page(
  '/a-propos/',
  'على الموقع',
  'من نحن، كيفاش نحضّرو المحتوى، وكيفاش تساهمي.',
  breadcrumb([{ label: 'الرئيسية', path: '/' }, { label: 'على الموقع' }]) +
    `<article class="wrap article"><div class="prose">${md(`
# على الموقع

## علاش هاذ الموقع

المعلومة القانونية في الجزائر موجودة، بصّح مبعثرة ومكتوبة بلغة ثقيلة. النتيجة: نساء يخسرو حقوق ماشي لأن القانون ضدّهم، بصّح لأنهم ما عرفوش واش يطلبو، ولا فاتهم أجل، ولا مضاو على ورقة ما فهموهاش.

هاذ الموقع يترجم النصّ القانوني لكلام يُفهَم، ويعطي معاه **الخطوة العملية** و**الوثيقة المطلوبة** — لأن الفرق بين حقّ على الورق وحقّ في اليدّ هو غالباً وثيقة وحدة وتاريخ.

## كيفاش نحضّرو المحتوى

1. كل معلومة ترجع للنصّ القانوني الأصلي (قانون الأسرة، قانون العقوبات، قانون العمل، قانون الإجراءات).
2. المرجع يتكتب **ظاهراً في الصفحة** — تشوفي المادة بعينيك، ما تصدّقيناش على الكلمة.
3. المحتوى يتراجع من طرف مختصّ قبل ما يتّاخذ بيه. الصفحات اللي مازال ما تراجعتش عندها **إشارة واضحة** في الأعلى.
4. كل صفحة عندها تاريخ آخر تحديث.

## واش هاذ الموقع ماشي

ماشي استشارة قانونية، وماشي بديل عن محامٍ. الموقع يعطيك الخريطة؛ الطريق في قضيّتك أنتِ يتقرّر مع مختصّ ولا عن طريق **مكتب المساعدة القضائية** اللي غالباً مجاني في حالتك.

## المساهمة

إذا عندك معلومة مؤكّدة (عنوان جمعية، مركز استماع، خلية استقبال في ولايتك)، ولا لقيتي غلطة قانونية ولا مرجعاً تغيّر: نحبّو نعرفو. المشروع مفتوح، والمحتوى كامل مكتوب في ملفات نصّ يقدر أي مختصّ يراجعها.

## الخصوصية

الموقع ما يطلبش منك أي معلومة شخصية، وما فيهش تسجيل ولا حساب. **ردّي بالك:** المتصفّح تاعك يسجّل تاريخ التصفّح — استعملي نافذة خاصة (Navigation privée) إذا كنتِ في وضعية حسّاسة، وزرّ **الخروج السريع** فوق الشاشة يخرّجك في الحين.
`)}</div></article>`,
  { priority: 0.5 }
);

/* ---------- ملفات إضافية ---------- */
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'assets'))) {
  fs.copyFileSync(path.join(root, 'assets', f), path.join(OUT, 'assets', f));
}

const base = site.baseUrl.replace(/\/$/, '');
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${base}${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n') +
    `\n</urlset>\n`
);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

/* ---------- قائمة المراجعة القانونية ---------- */
const citations = [];
for (const item of [...guides, ...models]) {
  const re = /^:::law\s*(.*)$\n([\s\S]*?)^:::\s*$/gm;
  let m;
  while ((m = re.exec(item.body))) {
    citations.push({ file: item.file, page: item.title, ref: m[1].trim() || '(بلا عنوان)', text: m[2].trim() });
  }
}
const pending = [...guides, ...models].filter((i) => i.revision !== 'verified');
fs.writeFileSync(
  path.join(root, 'REVISION-JURIDIQUE.md'),
  `# قائمة المراجعة القانونية

هاذ الملف يتولّد أوتوماتيكياً في كل \`npm run build\`. يجمع **كل** المراجع القانونية المذكورة في الموقع باش تتراجع وحدة بوحدة مقابل النصّ الرسمي.

- عدد الصفحات: **${guides.length + models.length}**
- صفحات مازال في طور المراجعة: **${pending.length}**
- عدد المراجع القانونية: **${citations.length}**

بعد ما تتأكّدي من صفحة، بدّلي \`revision: pending\` لـ \`revision: verified\` في الـ front-matter، وتختفي إشارة التنبيه من الصفحة أوتوماتيكياً.

## الصفحات اللي مازال ما تراجعتش

${pending.map((p) => `- [ ] \`${p.file}\` — ${p.title}`).join('\n')}

## كل المراجع القانونية المذكورة في الموقع

${citations
  .map(
    (c, i) => `### ${i + 1}. ${c.ref}
**الصفحة:** ${c.page} — \`${c.file}\`

> ${c.text.replace(/\n/g, '\n> ')}

- [ ] رقم المادة صحيح
- [ ] النصّ مطابق للنسخة المعدّلة السارية
- [ ] الصياغة المبسّطة ما تحرّفش المعنى
`
  )
  .join('\n')}
`
);

console.log(`✔ ${urls.length} صفحة — ${guides.length} دليل، ${models.length} نموذج، ${faqItems.length} سؤال، ${citations.length} مرجع قانوني`);
if (warnings.length) {
  console.log('\n⚠ تنبيهات:');
  warnings.forEach((w) => console.log('  - ' + w));
}
if (checkOnly && warnings.length) process.exit(1);
