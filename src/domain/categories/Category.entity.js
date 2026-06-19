/**
 * Domain layer — Category entity
 */
const Category = {
  fromRaw(id, label) {
    return { id, label };
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Category;
}
