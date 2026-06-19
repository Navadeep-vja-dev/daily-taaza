/**
 * Presentation layer — Application entry point
 */
const App = {
  pageHandlers: {
    home: HomePage,
    products: ProductsPage,
    'product-details': ProductDetailsPage,
    cart: CartPage,
    checkout: CheckoutPage,
    login: LoginPage,
    register: RegisterPage,
    account: AccountPage,
    orders: OrdersPage,
    'order-details': OrderDetailsPage,
  },

  async init() {
    Layout.init();
    Theme.init();
    Navigation.init();
    Animations.init();
    Forms.init();
    CustomerAuth.init();
    CartUI.init();

    try {
      await ProductRepository.loadAll();
    } catch (err) {
      console.error('Failed to load catalog:', err);
    }

    const page = document.body.dataset.page;
    const handler = this.pageHandlers[page];
    if (handler && typeof handler.init === 'function') {
      await handler.init();
    }
  },
};

function bootApp() {
  App.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
