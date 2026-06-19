/**
 * Presentation layer — Script loader (data → domain → presentation)
 */
(function () {
  var script = document.currentScript;
  var src = script.getAttribute('src') || script.src || '';
  var presentationBase = src.replace(/core\/init\.js(\?.*)?$/, '');

  var files = [
    presentationBase + 'config/site.config.js',
    presentationBase + 'core/paths.js',
    '/src/data/mock/products.mock.js',
    '/src/data/mock/categories.mock.js',
    '/src/data/storage/cart.localStorage.js',
    '/src/data/providers/MockProductProvider.js',
    '/src/data/providers/ApiProductProvider.js',
    '/src/data/providers/MysqlProductProvider.js',
    '/src/data/providers/ApiCartProvider.js',
    '/src/data/providers/CartStorageProvider.js',
    '/src/data/providers/ProductDataProvider.js',
    '/src/data/config/dataSource.config.js',
    '/src/domain/products/Product.entity.js',
    '/src/domain/products/ProductRepository.js',
    '/src/domain/categories/Category.entity.js',
    '/src/domain/categories/CategoryRepository.js',
    '/src/domain/products/ProductService.js',
    '/src/domain/cart/CartItem.entity.js',
    '/src/domain/cart/CartRepository.js',
    '/src/domain/cart/CartService.js',
    '/src/domain/orders/OrderService.js',
    '/src/domain/contact/ContactService.js',
    presentationBase + 'modules/product-ui.js',
    presentationBase + 'modules/cart-ui.js',
    presentationBase + 'modules/customer-auth.js',
    presentationBase + 'modules/customer-api.js',
    presentationBase + 'modules/theme.js',
    presentationBase + 'modules/navigation.js',
    presentationBase + 'modules/forms.js',
    presentationBase + 'modules/animations.js',
    presentationBase + 'components/layout.js',
    presentationBase + 'pages/home.page.js',
    presentationBase + 'pages/products.page.js',
    presentationBase + 'pages/product-details.page.js',
    presentationBase + 'pages/cart.page.js',
    presentationBase + 'pages/checkout.page.js',
    presentationBase + 'pages/login.page.js',
    presentationBase + 'pages/register.page.js',
    presentationBase + 'pages/account.page.js',
    presentationBase + 'pages/orders.page.js',
    presentationBase + 'pages/order-details.page.js',
    presentationBase + 'app.js',
  ];

  var index = 0;

  function loadNext() {
    if (index >= files.length) return;
    var el = document.createElement('script');
    el.src = files[index++];
    el.onload = loadNext;
    el.onerror = function () {
      console.error('Daily Taaza: failed to load', el.src);
      loadNext();
    };
    document.body.appendChild(el);
  }

  loadNext();
})();
