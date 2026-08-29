import { escapeHtml } from './md.js';

export function layout(site, page, body, extra = {}) {
  const title = page.title === site.name ? site.name : `${page.title} | ${site.name}`;
  const url = site.baseUrl.replace(/\/$/, '') + page.path;
  const desc = page.description || site.description;
  const nav = site.nav
    .map((n) => {
      const active = page.path === n.path || (n.path !== '/' && page.path.startsWith(n.path));
      return `<a href="${n.path}"${active ? ' aria-current="page"' : ''}>${escapeHtml(n.label)}</a>`;
    })
    .join('');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:locale" content="ar_DZ">
<meta property="og:site_name" content="${escapeHtml(site.name)}">
<meta property="og:title" content="${escapeHtml(page.title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap">
<link rel="stylesheet" href="/assets/style.css">
${extra.jsonLd ? `<script type="application/ld+json">${JSON.stringify(extra.jsonLd)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">تخطّي للمحتوى</a>

<div class="exit-bar">
  <button type="button" class="exit-btn" data-quick-exit>خروج سريع ✕</button>
  <span class="exit-hint">اضغطي <kbd>Échap</kbd> ثلاث مرات باش تخرجي بسرعة</span>
</div>

<header class="site-head">
  <div class="wrap head-inner">
    <a class="brand" href="/">
      <span class="brand__mark" aria-hidden="true">حق</span>
      <span class="brand__text"><b>${escapeHtml(site.name)}</b><small>${escapeHtml(site.tagline)}</small></span>
    </a>
    <button class="burger" type="button" aria-expanded="false" aria-controls="nav" data-burger>
      <span></span><span></span><span></span><span class="sr">القائمة</span>
    </button>
    <nav id="nav" class="nav">${nav}</nav>
  </div>
</header>

<main id="main">
${body}
</main>

<footer class="site-foot">
  <div class="wrap foot-grid">
    <div>
      <p class="foot-brand">${escapeHtml(site.name)}</p>
      <p class="muted">${escapeHtml(site.description)}</p>
    </div>
    <nav class="foot-links" aria-label="روابط الموقع">
      ${site.nav.map((n) => `<a href="${n.path}">${escapeHtml(n.label)}</a>`).join('')}
      <a href="/a-propos/">على الموقع</a>
    </nav>
    <p class="disclaimer">
      ${escapeHtml(site.disclaimer)}
    </p>
  </div>
  <p class="copy">© ${new Date().getFullYear()} ${escapeHtml(site.name)}</p>
</footer>
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

export function breadcrumb(items) {
  return (
    '<nav class="crumbs" aria-label="مسار التصفّح"><div class="wrap">' +
    items
      .map((it, idx) =>
        idx === items.length - 1
          ? `<span aria-current="page">${escapeHtml(it.label)}</span>`
          : `<a href="${it.path}">${escapeHtml(it.label)}</a><span class="sep">›</span>`
      )
      .join('') +
    '</div></nav>'
  );
}
