/**
 * Domain layer — Category repository
 */
const CategoryRepository = {
  getLabels() {
    return { ...CATEGORY_LABELS_MOCK };
  },

  getLabel(categoryId) {
    return CATEGORY_LABELS_MOCK[categoryId] || categoryId;
  },

  getAll() {
    return Object.entries(CATEGORY_LABELS_MOCK).map(([id, label]) => Category.fromRaw(id, label));
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryRepository;
}
