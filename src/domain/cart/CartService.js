/**
 * Domain layer — Cart business logic
 */
const CartService = {
  _async: CartStorageProvider.isAsync(),

  async getItems() {
    const items = await CartRepository.getItems();
    return items || [];
  },

  getItemsSync() {
    if (this._async) return [];
    return CartRepository.getItems() || [];
  },

  saveItems(cart) {
    CartRepository.saveItems(cart);
    this.dispatchUpdated();
  },

  dispatchUpdated() {
    this.getCount().then((count) => {
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count } }));
    });
  },

  async getCount() {
    const items = await this.getItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  async getTotal() {
    const items = await this.getItems();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  async add(productId, quantity = 1, variantId = null) {
    if (this._async) {
      await ApiCartProvider.addItem(productId, quantity, variantId);
      this.dispatchUpdated();
      return;
    }
    const product = ProductService.getById(productId);
    if (!product) return;
    const cart = this.getItemsSync();
    const key = variantId || productId;
    const existing = cart.find((item) => (item.variantId || item.id) === key);
    if (existing) existing.quantity += quantity;
    else cart.push(CartItem.fromProduct(product, quantity));
    this.saveItems(cart);
  },

  async remove(variantId) {
    if (this._async) {
      await ApiCartProvider.removeItem(variantId);
      this.dispatchUpdated();
      return;
    }
    this.saveItems(this.getItemsSync().filter((item) => (item.variantId || item.id) !== variantId));
  },

  async updateQuantity(variantId, quantity) {
    if (this._async) {
      await ApiCartProvider.updateItem(variantId, quantity);
      this.dispatchUpdated();
      return;
    }
    const cart = this.getItemsSync();
    const item = cart.find((i) => (i.variantId || i.id) === variantId);
    if (!item) return;
    if (quantity <= 0) {
      await this.remove(variantId);
      return;
    }
    item.quantity = quantity;
    this.saveItems(cart);
  },

  async clear() {
    if (this._async) {
      await ApiCartProvider.clear();
      this.dispatchUpdated();
      return;
    }
    this.saveItems([]);
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartService;
}
