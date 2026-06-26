/**
 * Data layer — API category provider
 */
const ApiCategoryProvider = {
  async getAll() {
    const base = DataSourceConfig.apiBaseUrl || '/api';
    const res = await fetch(base + '/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    const json = await res.json();
    return json.data || json;
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiCategoryProvider;
}
