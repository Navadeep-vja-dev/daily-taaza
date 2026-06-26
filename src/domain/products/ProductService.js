/**
 * Domain layer — Product business logic
 */
const ProductService = {
  async getAll() {
    return ProductRepository.getAll();
  },

  async getById(id) {
    return ProductRepository.getById(id);
  },

  async filter({ category = 'all', query = '' } = {}) {
    let result = await this.getAll();

    if (category && category !== 'all') {
      result = result.filter((p) => String(p.category) === String(category));
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (CategoryRepository.getLabel(p.category) || '').toLowerCase().includes(q)
      );
    }

    return result;
  },

  sort(products, sortBy) {
    const sorted = [...products];
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  },

  async getRelated(productId, limit = 4) {
    const product = await this.getById(productId);
    if (!product) return [];
    const all = await this.getAll();
    return all.filter((p) => p.category === product.category && p.id !== productId).slice(0, limit);
  },

  formatPrice(price) {
    return '₹' + price.toLocaleString('en-IN');
  },

  injectJsonLd(data) {
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify(data);
    document.head.appendChild(ld);
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductService;
}
