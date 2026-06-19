/**
 * Data layer — cart storage provider factory
 */
const CartStorageProvider = {
  getProvider() {
    return DataSourceConfig.cart === 'api' ? ApiCartProvider : CartLocalStorage;
  },

  get() {
    const provider = this.getProvider();
    if (provider === CartLocalStorage) {
      return provider.get(SiteConfig.cartKey);
    }
    return null;
  },

  save(cart) {
    const provider = this.getProvider();
    if (provider === CartLocalStorage) {
      provider.save(SiteConfig.cartKey, cart);
    }
  },

  isAsync() {
    return DataSourceConfig.cart === 'api';
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartStorageProvider;
}
