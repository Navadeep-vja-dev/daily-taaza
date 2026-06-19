/**
 * Presentation layer — Products listing page
 */
const ProductsPage = {
  async init() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const params = new URLSearchParams(window.location.search);
    let currentCategory = params.get('category') || 'all';
    let currentQuery = params.get('q') || '';
    let currentSort = 'default';

    const searchInput = document.getElementById('products-search');
    const sortSelect = document.getElementById('sort-select');
    const chips = document.querySelectorAll('.filter-chip');

    if (searchInput && currentQuery) {
      searchInput.value = currentQuery;
      document.querySelector('.search-bar')?.classList.add('open');
    }

    const updateChips = () => {
      chips.forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.category === currentCategory);
      });
    };

    const render = async () => {
      let products = await ProductService.filter({ category: currentCategory, query: currentQuery });
      products = ProductService.sort(products, currentSort);
      renderProductGrid(grid, products);
    };

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        currentCategory = chip.dataset.category;
        updateChips();
        render();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentQuery = searchInput.value;
        render();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        render();
      });
    }

    updateChips();
    await render();

    const all = await ProductService.getAll();
    ProductService.injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: all.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: SiteConfig.url + '/pages/product-details.html?id=' + p.id,
        name: p.name,
      })),
    });
  },
};
