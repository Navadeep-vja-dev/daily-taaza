/**
 * Domain layer — Category repository
 */
const CategoryRepository = {
  _labels: { ...CATEGORY_LABELS_MOCK },

  getLabels() {
    return { ...this._labels };
  },

  getLabel(categoryId) {
    return this._labels[categoryId] || categoryId;
  },

  getAll() {
    return Object.entries(this._labels).map(([id, label]) => Category.fromRaw(id, label));
  },

  /**
   * Fetch categories from the backend and cache their labels.
   * Falls back to the bundled mock labels if the request fails.
   */
  async loadFromApi() {
    if (typeof ApiCategoryProvider === 'undefined') return this.getAll();
    try {
      const categories = await ApiCategoryProvider.getAll();
      if (Array.isArray(categories) && categories.length) {
        const labels = {};
        categories.forEach((c) => {
          if (c && c.id) labels[c.id] = c.label || c.id;
        });
        this._labels = labels;
      }
    } catch (err) {
      console.error('Daily Taaza: failed to load categories from API', err);
    }
    return this.getAll();
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryRepository;
}
