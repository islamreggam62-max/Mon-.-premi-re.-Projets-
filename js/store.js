/* منطق مشترك بين كل الصفحات: السلة، التنسيق، رأس الصفحة، التنبيهات. */

const CART_KEY = 'nour-store-cart-v1';
const CURRENCY = 'د.م';

/* ---------- أدوات عامة ---------- */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function formatPrice(value) {
  return `${Number(value).toLocaleString('ar-MA', { maximumFractionDigits: 2 })} ${CURRENCY}`;
}

/* صيغة الجمع في العربية: 1 مفرد، 2 مثنّى، 3–10 جمع، 11+ تمييز مفرد منصوب */
function arabicPlural(count, forms) {
  const n = Math.abs(count) % 100;
  if (count === 1) return forms.one;
  if (count === 2) return forms.two;
  if (n >= 3 && n <= 10) return forms.few;
  return forms.many;
}

const PIECES  = { one: 'قطعة واحدة', two: 'قطعتان', few: 'قطع', many: 'قطعة' };
const ITEMS   = { one: 'منتج واحد', two: 'منتجان', few: 'منتجات', many: 'منتجًا' };

/* «3 قطع» مقابل «قطعة واحدة» — لا نكرّر العدد في صيغتَي المفرد والمثنّى */
function countLabel(count, forms) {
  const word = arabicPlural(count, forms);
  return count === 1 || count === 2 ? word : `${count} ${word}`;
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function ratingStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '☆' : '') + '·'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
}

/* ---------- السلة ---------- */

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // نتجاهل أي عنصر لم يعد موجودًا في قائمة المنتجات
    return parsed
      .filter((item) => item && typeof item.id === 'string' && getProduct(item.id))
      .map((item) => ({ id: item.id, qty: Math.max(1, Math.min(99, parseInt(item.qty, 10) || 1)) }));
  } catch (err) {
    console.warn('تعذّرت قراءة السلة من التخزين المحلي:', err);
    return [];
  }
}

function writeCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (err) {
    console.warn('تعذّر حفظ السلة:', err);
  }
  document.dispatchEvent(new CustomEvent('cart:change', { detail: { cart } }));
}

function cartCount() {
  return readCart().reduce((sum, item) => sum + item.qty, 0);
}

function addToCart(id, qty = 1) {
  const product = getProduct(id);
  if (!product) return false;
  if (product.stock === 0) return false;

  const cart = readCart();
  const existing = cart.find((item) => item.id === id);
  const currentQty = existing ? existing.qty : 0;
  const nextQty = Math.min(product.stock, currentQty + qty);

  if (nextQty === currentQty) {
    showToast(`الكمية المتاحة من «${product.name}» هي ${product.stock} فقط.`, 'warn');
    return false;
  }
  if (existing) existing.qty = nextQty;
  else cart.push({ id, qty: nextQty });

  writeCart(cart);
  showToast(`أُضيف «${product.name}» إلى السلة.`);
  return true;
}

function setQty(id, qty) {
  const product = getProduct(id);
  if (!product) return;
  const cart = readCart();
  const item = cart.find((entry) => entry.id === id);
  if (!item) return;

  const clamped = Math.max(0, Math.min(product.stock, qty));
  if (clamped === 0) {
    writeCart(cart.filter((entry) => entry.id !== id));
    return;
  }
  if (clamped < qty) showToast(`المتاح من «${product.name}» هو ${product.stock} فقط.`, 'warn');
  item.qty = clamped;
  writeCart(cart);
}

function removeFromCart(id) {
  writeCart(readCart().filter((item) => item.id !== id));
}

function clearCart() {
  writeCart([]);
}

/* ---------- الحسابات ---------- */

function cartTotals(promo = null) {
  const lines = readCart().map((item) => {
    const product = getProduct(item.id);
    return { product, qty: item.qty, lineTotal: product.price * item.qty };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  let discount = 0;
  let shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;

  if (promo && PROMO_CODES[promo]) {
    const rule = PROMO_CODES[promo];
    if (rule.type === 'percent') discount = Math.round(subtotal * (rule.value / 100));
    else if (rule.type === 'fixed') discount = Math.min(subtotal, rule.value);
    else if (rule.type === 'shipping') shipping = 0;
  }

  return { lines, subtotal, discount, shipping, total: Math.max(0, subtotal - discount) + shipping };
}

/* ---------- التنبيهات ---------- */

function showToast(message, kind = 'success') {
  let host = $('#toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.className = 'toast-host';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${kind}`;
  toast.textContent = message;
  host.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--out');
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

/* ---------- رأس الصفحة ---------- */

function refreshCartBadge() {
  const count = cartCount();
  $$('[data-cart-count]').forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}

function initHeader() {
  refreshCartBadge();
  document.addEventListener('cart:change', refreshCartBadge);
  // مزامنة بين تبويبات المتصفح المفتوحة
  window.addEventListener('storage', (event) => {
    if (event.key === CART_KEY) {
      refreshCartBadge();
      document.dispatchEvent(new CustomEvent('cart:external-change'));
    }
  });

  const toggle = $('.nav-toggle');
  const nav = $('#site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- بطاقة منتج ---------- */

function productCard(product) {
  const soldOut = product.stock === 0;
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const article = document.createElement('article');
  article.className = 'card' + (soldOut ? ' card--out' : '');
  article.innerHTML = `
    <a class="card__media" href="product.html?id=${encodeURIComponent(product.id)}">
      <img src="${product.image}" alt="${product.name}" loading="lazy" width="600" height="600">
      ${discount ? `<span class="badge badge--sale">خصم ${discount}%\u200E</span>` : ''}
      ${soldOut ? '<span class="badge badge--out">نفد المخزون</span>' : ''}
    </a>
    <div class="card__body">
      <h3 class="card__title">
        <a href="product.html?id=${encodeURIComponent(product.id)}">${product.name}</a>
      </h3>
      <p class="card__short">${product.short}</p>
      <div class="card__rating" title="${product.rating} من 5">
        <span class="stars" aria-hidden="true">${ratingStars(product.rating)}</span>
        <span class="muted">${product.rating} (${product.reviews})</span>
      </div>
      <div class="card__footer">
        <div class="price">
          <strong>${formatPrice(product.price)}</strong>
          ${product.oldPrice ? `<s>${formatPrice(product.oldPrice)}</s>` : ''}
        </div>
        <button class="btn btn--primary btn--sm" data-add="${product.id}" ${soldOut ? 'disabled' : ''}>
          ${soldOut ? 'غير متوفر' : 'أضف للسلة'}
        </button>
      </div>
    </div>`;
  return article;
}

/* تفويض حدث الإضافة للسلة لكل الأزرار التي تحمل data-add */
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button || button.disabled) return;
  event.preventDefault();
  const qtyInput = button.dataset.qtySource ? $(button.dataset.qtySource) : null;
  const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
  addToCart(button.dataset.add, qty);
});

document.addEventListener('DOMContentLoaded', initHeader);
