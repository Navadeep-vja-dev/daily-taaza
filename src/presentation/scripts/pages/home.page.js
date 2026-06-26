/**
 * Presentation layer — Home page
 */
const HomePage = {
  _iconFor(label) {
    const l = String(label || '').toLowerCase();
    if (l.includes('batter')) return '🥞';
    if (l.includes('karapod') || l.includes('podi') || l.includes('podulu')) return '🌶️';
    if (l.includes('ladoo') || l.includes('laddu')) return '🍬';
    if (l.includes('pickle')) return '🥒';
    if (l.includes('ghee')) return '🧈';
    if (l.includes('millet')) return '🌾';
    if (l.includes('snack')) return '🍪';
    return '🍃';
  },

  _descFor(label) {
    const l = String(label || '').toLowerCase();
    if (l.includes('batter')) return 'Stone-ground idli, dosa & adai batters';
    if (l.includes('karapod') || l.includes('podi') || l.includes('podulu')) return 'Hand-roasted spice powders & podis';
    if (l.includes('ladoo') || l.includes('laddu')) return 'Jaggery-sweetened, nutrient-rich treats';
    if (l.includes('pickle')) return 'Traditional pickles & preserves';
    if (l.includes('ghee')) return 'Pure, homemade golden ghee';
    if (l.includes('millet')) return 'Wholesome, fibre-rich millet mixes';
    return 'Freshly made in small batches';
  },

  _escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  renderCategories() {
    const grid = document.getElementById('home-categories');
    if (!grid) return;
    if (typeof CategoryRepository === 'undefined') return;

    const categories = CategoryRepository.getAll();
    if (!Array.isArray(categories) || !categories.length) return;

    const productsHref =
      typeof Paths !== 'undefined' && Paths.pageHref
        ? Paths.pageHref('products.html')
        : 'pages/products.html';

    const columns = categories.length >= 4 ? 'grid-4' : categories.length === 2 ? 'grid-2' : 'grid-3';
    grid.className = 'grid ' + columns + ' stagger-group';

    grid.innerHTML = categories
      .map(
        (c) =>
          '<a href="' +
          productsHref +
          '?category=' +
          encodeURIComponent(c.id) +
          '" class="category-card reveal reveal--up">' +
          '<div class="category-card__icon" aria-hidden="true">' +
          this._iconFor(c.label) +
          '</div>' +
          '<h3 class="category-card__title">' +
          this._escape(c.label) +
          '</h3>' +
          '<p class="category-card__desc">' +
          this._escape(this._descFor(c.label)) +
          '</p>' +
          '</a>'
      )
      .join('');

    if (typeof Animations !== 'undefined' && typeof Animations.initReveal === 'function') {
      Animations.initReveal(grid);
    }
  },

  async init() {
    if (typeof CategoryRepository !== 'undefined' && CategoryRepository.loadFromApi) {
      try {
        await CategoryRepository.loadFromApi();
      } catch (err) {
        console.error('Daily Taaza: failed to load categories on home page', err);
      }
    }
    this.renderCategories();

    const featuredGrid = document.getElementById('featured-products');
    if (featuredGrid) {
      const products = await ProductService.getAll();
      renderProductGrid(featuredGrid, products.slice(0, 4));
    }
  },
};
