/* منطق الصفحة الرئيسية: العروض، التصفية، البحث، الترتيب. */

(function () {
  const state = { category: 'all', query: '', sort: 'featured' };

  const grid        = $('#products-grid');
  const offersGrid  = $('#offers-grid');
  const chipsHost   = $('#category-chips');
  const searchInput = $('#search');
  const sortSelect  = $('#sort');
  const resultsLabel = $('#results-count');
  const emptyState  = $('#empty-state');

  /* --- العروض --- */
  function renderOffers() {
    const offers = PRODUCTS.filter((p) => p.oldPrice).slice(0, 4);
    offersGrid.replaceChildren(...offers.map(productCard));
  }

  /* --- شرائح التصنيفات --- */
  function renderChips() {
    chipsHost.replaceChildren(
      ...CATEGORIES.map((category) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chip' + (category.id === state.category ? ' is-active' : '');
        button.textContent = category.name;
        button.dataset.category = category.id;
        button.setAttribute('aria-pressed', String(category.id === state.category));
        return button;
      })
    );
  }

  /* --- التصفية والترتيب --- */
  function visibleProducts() {
    const query = state.query.trim().toLowerCase();

    let list = PRODUCTS.filter((product) => {
      const matchesCategory = state.category === 'all' || product.category === state.category;
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.short.toLowerCase().includes(query) ||
        product.features.some((feature) => feature.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });

    const sorters = {
      'price-asc':  (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      'rating':     (a, b) => b.rating - a.rating,
      'name':       (a, b) => a.name.localeCompare(b.name, 'ar'),
      // «مميّز»: المتوفر أولًا، ثم الأعلى تقييمًا
      'featured':   (a, b) => (b.stock > 0) - (a.stock > 0) || b.rating - a.rating
    };
    return list.sort(sorters[state.sort] || sorters.featured);
  }

  function render() {
    const list = visibleProducts();
    grid.replaceChildren(...list.map(productCard));
    resultsLabel.textContent = list.length
      ? `${countLabel(list.length, ITEMS)} من أصل ${PRODUCTS.length}`
      : '';
    emptyState.hidden = list.length > 0;
  }

  /* --- الأحداث --- */
  chipsHost.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-category]');
    if (!chip) return;
    state.category = chip.dataset.category;
    renderChips();
    render();
  });

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = searchInput.value;
      render();
    }, 150);
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    render();
  });

  $('#reset-filters').addEventListener('click', () => {
    state.category = 'all';
    state.query = '';
    state.sort = 'featured';
    searchInput.value = '';
    sortSelect.value = 'featured';
    renderChips();
    render();
  });

  $('#newsletter-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#news-email');
    if (!input.checkValidity()) {
      showToast('من فضلك أدخل بريدًا إلكترونيًا صحيحًا.', 'warn');
      input.focus();
      return;
    }
    input.value = '';
    showToast('تم تسجيل بريدك. شكرًا لك!');
  });

  /* --- التشغيل --- */
  const statProducts = $('[data-stat="products"]');
  if (statProducts) statProducts.textContent = `+${PRODUCTS.length}`;

  renderOffers();
  renderChips();
  render();
})();
