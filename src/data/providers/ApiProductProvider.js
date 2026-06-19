/**
 * Data layer — API product provider (future)
 */
const ApiProductProvider = {
  async getAll() {
    const base = DataSourceConfig.apiBaseUrl || '/api';
    const res = await fetch(base + '/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    const json = await res.json();
    return json.data || json;
  },

  async getById(id) {
    const base = DataSourceConfig.apiBaseUrl || '/api';
    const res = await fetch(base + '/products/' + encodeURIComponent(id));
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiProductProvider;
}
