/**
 * Data layer — mock product provider
 */
const MockProductProvider = {
  getAll() {
    return PRODUCTS_MOCK.map((p) => ({ ...p }));
  },

  getById(id) {
    const product = PRODUCTS_MOCK.find((p) => p.id === id);
    return product ? { ...product } : null;
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MockProductProvider;
}
