/**
 * Presentation layer — Cart page
 */
const CartPage = {
  async init() {
    if (document.getElementById('cart-items')) {
      await CartUI.renderPage();
    }
  },
};
