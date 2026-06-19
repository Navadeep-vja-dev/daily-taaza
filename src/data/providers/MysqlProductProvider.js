/**
 * Data layer — MySQL product provider stub (server-side only)
 */
const MysqlProductProvider = {
  getAll() {
    throw new Error('MysqlProductProvider is server-side only. Configure API mode on the client.');
  },

  getById() {
    throw new Error('MysqlProductProvider is server-side only. Configure API mode on the client.');
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MysqlProductProvider;
}
