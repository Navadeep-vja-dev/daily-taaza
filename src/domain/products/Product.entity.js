/**
 * Domain layer — Product entity
 */
const Product = {
  fromRaw(raw) {
    if (!raw) return null;
    return { ...raw };
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Product;
}
