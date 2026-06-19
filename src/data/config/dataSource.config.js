/**
 * Data layer — source configuration (mock | api | mysql)
 */
const DataSourceConfig = {
  products: 'api',
  cart: 'api',
  apiBaseUrl: '/api',
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataSourceConfig;
}
