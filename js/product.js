/* صفحة المنتج: تقرأ المعرّف من عنوان الصفحة (?id=) وتعرض التفاصيل. */

(function () {
  const root = $('#product-root');
  const params = new URLSearchParams(window.location.search);
  const product = getProduct(params.get('id'));

  if (!product) {
    document.title = 'المنتج غير موجود — متجر نور';
    $('#crumb-current').textContent = 'غير موجود';
    root.innerHTML = `
      <div class="notice">
        <h1>لم نعثر على هذا المنتج</h1>
        <p class="muted">ربما حُذف الرابط أو كُتب بشكل خاطئ.</p>
        <a class="btn btn--primary" href="index.html#products">العودة إلى المنتجات</a>
      </div>`;
    return;
  }

  document.title = `${product.name} — متجر نور`;
  $('#crumb-current').textContent = product.name;

  const soldOut = product.stock === 0;
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const categoryName = (CATEGORIES.find((c) => c.id === product.category) || {}).name || '';

  root.innerHTML = `
    <div class="product">
      <div class="product__media">
        <img src="${product.image}" alt="${product.name}" width="600" height="600">
        ${discount ? `<span class="badge badge--sale">خصم ${discount}%\u200E</span>` : ''}
      </div>

      <div class="product__info">
        <p class="eyebrow">${categoryName}</p>
        <h1>${product.name}</h1>

        <div class="card__rating">
          <span class="stars" aria-hidden="true">${ratingStars(product.rating)}</span>
          <span class="muted">${product.rating} من 5 · ${product.reviews} تقييمًا</span>
        </div>

        <div class="price price--lg">
          <strong>${formatPrice(product.price)}</strong>
          ${product.oldPrice ? `<s>${formatPrice(product.oldPrice)}</s>` : ''}
        </div>

        <p class="product__desc">${product.description}</p>

        <ul class="features">
          ${product.features.map((feature) => `<li>${feature}</li>`).join('')}
        </ul>

        <p class="stock ${soldOut ? 'stock--out' : product.stock <= 5 ? 'stock--low' : 'stock--in'}">
          ${soldOut
            ? 'نفد المخزون حاليًا'
            : product.stock <= 5
              ? `بقيت ${product.stock} قطع فقط`
              : 'متوفر في المخزون'}
        </p>

        <div class="buy">
          <div class="qty" role="group" aria-label="الكمية">
            <button type="button" class="qty__btn" data-step="-1" ${soldOut ? 'disabled' : ''}>−</button>
            <input class="qty__input" id="qty" type="number" value="1" min="1"
                   max="${Math.max(1, product.stock)}" ${soldOut ? 'disabled' : ''}
                   aria-label="الكمية">
            <button type="button" class="qty__btn" data-step="1" ${soldOut ? 'disabled' : ''}>+</button>
          </div>
          <button class="btn btn--primary btn--lg" data-add="${product.id}" data-qty-source="#qty"
                  ${soldOut ? 'disabled' : ''}>
            ${soldOut ? 'غير متوفر' : 'أضف إلى السلة'}
          </button>
          <a class="btn btn--ghost btn--lg" href="cart.html">عرض السلة</a>
        </div>

        <ul class="perks">
          <li>شحن مجاني للطلبات فوق ${formatPrice(FREE_SHIPPING_FROM)}</li>
          <li>إرجاع مجاني خلال 14 يومًا</li>
          <li>ضمان سنة على عيوب التصنيع</li>
        </ul>
      </div>
    </div>`;

  /* أزرار الكمية */
  const qtyInput = $('#qty');
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-step]');
    if (!button) return;
    const step = Number(button.dataset.step);
    const next = (parseInt(qtyInput.value, 10) || 1) + step;
    qtyInput.value = Math.max(1, Math.min(product.stock, next));
  });
  qtyInput.addEventListener('change', () => {
    const value = parseInt(qtyInput.value, 10) || 1;
    qtyInput.value = Math.max(1, Math.min(product.stock, value));
  });

  /* منتجات مقترحة من التصنيف نفسه */
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  if (related.length) {
    $('#related-grid').replaceChildren(...related.map(productCard));
    $('#related-section').hidden = false;
  }
})();
