/**
 * Domain layer — Cart repository
 */
const CartRepository = {
  getItems() {
    if (CartStorageProvider.isAsync()) return ApiCartProvider.getItems();
    return CartStorageProvider.get();
  },

  saveItems(cart) {
    if (!CartStorageProvider.isAsync()) {
      CartStorageProvider.save(cart);
    }
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartRepository;
}
