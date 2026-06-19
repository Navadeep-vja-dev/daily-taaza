/**
 * Data layer — product provider factory
 */
const ProductDataProvider = {
  getProvider() {
    switch (DataSourceConfig.products) {
      case 'api':
        return ApiProductProvider;
      case 'mysql':
        return MysqlProductProvider;
      case 'mock':
      default:
        return MockProductProvider;
    }
  },

  getAll() {
    const provider = this.getProvider();
    const result = provider.getAll();
    if (result && typeof result.then === 'function') return result;
    return Promise.resolve(result);
  },

  getById(id) {
    const provider = this.getProvider();
    const result = provider.getById(id);
    if (result && typeof result.then === 'function') return result;
    return Promise.resolve(result);
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductDataProvider;
}
