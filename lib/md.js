// محلّل Markdown مصغّر بلا أي تبعية خارجية.
// يدعم: العناوين، الفقرات، القوائم، الجداول، الاقتباس، الروابط،
// بالإضافة إلى كتل خاصة بالمشروع: :::note ، :::warn ، :::law ، :::step

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BLOCK_LABELS = {
  note: 'باش تعرف',
  warn: 'ردّي بالك',
  law: 'المرجع القانوني',
  step: 'الخطوات',
  quote: 'اقتباس',
};

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
    const external = /^https?:/.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${attrs}>${label}</a>`;
  });
  // حقل يعمّر في النماذج: {{ اسم ولقب المدّعية }}
  out = out.replace(/\{\{([^}]+)\}\}/g, '<span class="fill">$1</span>');
  return out;
}

function slugify(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export function renderMarkdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const headings = [];
  let i = 0;

  const flushList = (tag, items) => {
    html.push(`<${tag}>` + items.map((it) => `<li>${inline(it)}</li>`).join('') + `</${tag}>`);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // كتلة خاصة :::type
    const block = line.match(/^:::(\w+)\s*(.*)$/);
    if (block) {
      const type = block[1];
      const title = block[2].trim() || BLOCK_LABELS[type] || '';
      const body = [];
      let depth = 1;
      i++;
      while (i < lines.length) {
        if (/^:::\w/.test(lines[i])) depth++;
        else if (/^:::\s*$/.test(lines[i])) {
          depth--;
          if (depth === 0) break;
        }
        body.push(lines[i]);
        i++;
      }
      i++; // تخطّي ::: تاع الإغلاق
      const inner = renderMarkdown(body.join('\n')).html;
      html.push(
        `<aside class="callout callout--${type}">` +
        (title ? `<p class="callout__title">${escapeHtml(title)}</p>` : '') +
        inner + '</aside>'
      );
      continue;
    }

    // عنوان
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = inline(h[2]);
      const id = slugify(h[2]);
      if (level === 2) headings.push({ id, text });
      html.push(`<h${level} id="${id}">${text}</h${level}>`);
      i++;
      continue;
    }

    // جدول
    if (/^\|/.test(line) && /^\|[\s:|-]+\|?$/.test(lines[i + 1] || '')) {
      const row = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = row(line);
      i += 2;
      const body = [];
      while (i < lines.length && /^\|/.test(lines[i])) { body.push(row(lines[i])); i++; }
      html.push(
        '<div class="table-wrap"><table><thead><tr>' +
        head.map((c) => `<th>${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>'
      );
      continue;
    }

    // اقتباس
    if (/^>\s?/.test(line)) {
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { body.push(lines[i].replace(/^>\s?/, '')); i++; }
      html.push(`<blockquote>${renderMarkdown(body.join('\n')).html}</blockquote>`);
      continue;
    }

    // قائمة مرقّمة
    if (/^\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+[.)]\s+/, '')); i++;
      }
      flushList('ol', items);
      continue;
    }

    // قائمة نقطية
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, '')); i++;
      }
      flushList('ul', items);
      continue;
    }

    // فاصل
    if (/^---+$/.test(line.trim())) { html.push('<hr>'); i++; continue; }

    // فقرة
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|[-*]\s|\d+[.)]\s|>|\||:::)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`);
    else i++;
  }

  return { html: html.join('\n'), headings };
}

// front-matter مبسّط: key: value ، والقوائم بصيغة [a, b, c]
export function parseFrontMatter(raw) {
  const text = raw.replace(/^﻿/, '');
  if (!text.startsWith('---')) return { meta: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, body: text };
  const head = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n/, '');
  const meta = {};
  for (const line of head.split('\n')) {
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (/^\[.*\]$/.test(value)) {
      value = value.slice(1, -1).split(',').map((v) => v.trim()).filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
    }
    meta[m[1]] = value;
  }
  return { meta, body };
}

export { escapeHtml, slugify };
