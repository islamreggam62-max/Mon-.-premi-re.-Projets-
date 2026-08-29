/* صفحة السلة: العناصر، كود الخصم، الملخّص، وإتمام الطلب. */

(function () {
  let promo = null; // كود الخصم المطبَّق

  const emptyBox   = $('#cart-empty');
  const layout     = $('#cart-layout');
  const linesHost  = $('#cart-lines');
  const checkout   = $('#checkout');
  const confirm    = $('#confirmation');

  /* ---------- عرض العناصر ---------- */

  function lineRow(line) {
    const { product, qty, lineTotal } = line;
    const row = document.createElement('div');
    row.className = 'line';
    row.innerHTML = `
      <a class="line__media" href="product.html?id=${encodeURIComponent(product.id)}">
        <img src="${product.image}" alt="${product.name}" width="120" height="120" loading="lazy">
      </a>
      <div class="line__info">
        <h3><a href="product.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3>
        <p class="muted small">${product.short}</p>
        <p class="muted small">سعر القطعة: ${formatPrice(product.price)}</p>
      </div>
      <div class="line__qty">
        <div class="qty" role="group" aria-label="كمية ${product.name}">
          <button type="button" class="qty__btn" data-dec="${product.id}">−</button>
          <input class="qty__input" type="number" value="${qty}" min="1" max="${product.stock}"
                 data-qty="${product.id}" aria-label="كمية ${product.name}">
          <button type="button" class="qty__btn" data-inc="${product.id}">+</button>
        </div>
        <button class="link-btn link-btn--danger" data-remove="${product.id}">حذف</button>
      </div>
      <div class="line__total"><strong>${formatPrice(lineTotal)}</strong></div>`;
    return row;
  }

  function render() {
    const totals = cartTotals(promo);
    const isEmpty = totals.lines.length === 0;

    emptyBox.hidden = !isEmpty || !confirm.hidden;
    layout.hidden = isEmpty || !confirm.hidden;
    if (isEmpty) {
      checkout.hidden = true;
      return;
    }

    linesHost.replaceChildren(...totals.lines.map(lineRow));

    $('#sum-subtotal').textContent = formatPrice(totals.subtotal);
    $('#sum-shipping').textContent = totals.shipping === 0 ? 'مجاني' : formatPrice(totals.shipping);
    $('#sum-total').textContent    = formatPrice(totals.total);

    const discountRow = $('#row-discount');
    discountRow.hidden = totals.discount === 0;
    // بدون إشارة سالبة: الإشارات المحايدة تنقلب في السياق العربي — نميّز السطر باللون بدلًا منها
    $('#sum-discount').textContent = formatPrice(totals.discount);

    const remaining = FREE_SHIPPING_FROM - totals.subtotal;
    $('#free-shipping-hint').textContent =
      totals.shipping === 0
        ? 'يشمل طلبك شحنًا مجانيًا.'
        : `أضف ${formatPrice(remaining)} أخرى للحصول على شحن مجاني.`;
  }

  /* ---------- أحداث العناصر ---------- */

  linesHost.addEventListener('click', (event) => {
    const inc = event.target.closest('[data-inc]');
    const dec = event.target.closest('[data-dec]');
    const del = event.target.closest('[data-remove]');
    if (inc) {
      const id = inc.dataset.inc;
      const current = readCart().find((item) => item.id === id);
      setQty(id, (current ? current.qty : 0) + 1);
    } else if (dec) {
      const id = dec.dataset.dec;
      const current = readCart().find((item) => item.id === id);
      setQty(id, (current ? current.qty : 1) - 1);
    } else if (del) {
      const product = getProduct(del.dataset.remove);
      removeFromCart(del.dataset.remove);
      if (product) showToast(`حُذف «${product.name}» من السلة.`, 'warn');
    }
  });

  linesHost.addEventListener('change', (event) => {
    const input = event.target.closest('[data-qty]');
    if (!input) return;
    setQty(input.dataset.qty, parseInt(input.value, 10) || 1);
  });

  $('#clear-cart').addEventListener('click', () => {
    if (readCart().length === 0) return;
    if (window.confirm('هل تريد إفراغ السلة بالكامل؟')) {
      clearCart();
      promo = null;
      $('#promo').value = '';
      $('#promo-status').textContent = '';
      showToast('أُفرغت السلة.', 'warn');
    }
  });

  /* ---------- كود الخصم ---------- */

  $('#promo-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#promo');
    const code = input.value.trim().toUpperCase();
    const status = $('#promo-status');

    if (!code) {
      promo = null;
      status.textContent = '';
      render();
      return;
    }
    if (PROMO_CODES[code]) {
      promo = code;
      status.textContent = `تم تطبيق: ${PROMO_CODES[code].label}`;
      status.classList.remove('is-error');
      showToast('تم تطبيق كود الخصم.');
    } else {
      promo = null;
      status.textContent = 'هذا الكود غير صالح.';
      status.classList.add('is-error');
    }
    render();
  });

  /* ---------- إتمام الطلب ---------- */

  $('#checkout-open').addEventListener('click', () => {
    checkout.hidden = false;
    checkout.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const first = $('#checkout-form input[name="name"]');
    if (first) first.focus({ preventScroll: true });
  });

  $('#checkout-cancel').addEventListener('click', () => {
    checkout.hidden = true;
  });

  const form = $('#checkout-form');

  const MESSAGES = {
    name:    'اكتب اسمك الكامل (3 أحرف على الأقل).',
    email:   'اكتب بريدًا إلكترونيًا صحيحًا.',
    phone:   'اكتب رقم هاتف صحيحًا (8 أرقام على الأقل).',
    city:    'اكتب اسم المدينة.',
    address: 'اكتب عنوانًا واضحًا (5 أحرف على الأقل).'
  };

  function validate() {
    let firstInvalid = null;
    Object.keys(MESSAGES).forEach((name) => {
      const input = form.elements[name];
      const slot = $(`[data-error-for="${name}"]`, form);
      const valid = input.checkValidity() && input.value.trim() !== '';
      slot.textContent = valid ? '' : MESSAGES[name];
      input.setAttribute('aria-invalid', String(!valid));
      input.classList.toggle('is-invalid', !valid);
      if (!valid && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  }

  form.addEventListener('input', (event) => {
    const name = event.target.name;
    if (!MESSAGES[name]) return;
    if (event.target.checkValidity() && event.target.value.trim() !== '') {
      $(`[data-error-for="${name}"]`, form).textContent = '';
      event.target.classList.remove('is-invalid');
      event.target.setAttribute('aria-invalid', 'false');
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const invalid = validate();
    if (invalid) {
      invalid.focus();
      showToast('راجع الحقول المطلوبة قبل التأكيد.', 'warn');
      return;
    }

    const totals = cartTotals(promo);
    if (totals.lines.length === 0) {
      showToast('سلتك فارغة.', 'warn');
      return;
    }

    const orderId = 'NR-' + Date.now().toString(36).toUpperCase().slice(-6);
    const itemCount = totals.lines.reduce((sum, line) => sum + line.qty, 0);
    const name = form.elements.name.value.trim();

    $('#order-id').textContent = orderId;
    $('#order-summary').textContent =
      `شكرًا ${name}. ${countLabel(itemCount, PIECES)} بإجمالي ${formatPrice(totals.total)}، ` +
      `وسنتواصل معك على ${form.elements.phone.value.trim()} لتأكيد التوصيل.`;

    clearCart();
    promo = null;
    form.reset();

    checkout.hidden = true;
    layout.hidden = true;
    emptyBox.hidden = true;
    confirm.hidden = false;
    confirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ---------- إعادة الرسم عند أي تغيير ---------- */
  document.addEventListener('cart:change', render);
  document.addEventListener('cart:external-change', render);
  render();
})();
