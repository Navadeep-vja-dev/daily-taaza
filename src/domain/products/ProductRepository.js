/**
 * Domain layer — Product repository
 */
const ProductRepository = {
  _cache: null,

  async loadAll() {
    const raw = await ProductDataProvider.getAll();
    this._cache = raw.map(Product.fromRaw);
    return this._cache;
  },

  async getAll() {
    if (this._cache) return this._cache;
    return this.loadAll();
  },

  async getById(id) {
    const all = await this.getAll();
    return all.find((p) => p.id === id) || null;
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductRepository;
}
