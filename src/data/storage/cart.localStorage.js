/**
 * Data layer — cart localStorage read/write only
 */
const CartLocalStorage = {
  get(storageKey) {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(storageKey, cart) {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartLocalStorage;
}
