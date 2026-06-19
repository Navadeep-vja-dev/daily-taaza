const AdminDashboardPage = {
  async init() {
    if (!AdminAuth.requireAuth()) return;

    AdminLayout.mount('dashboard', 'Dashboard', '<div class="admin-stats" id="stats">Loading...</div>');

    try {
      const [products, orders, messages] = await Promise.all([
        AdminApi.get('/admin/products'),
        AdminApi.get('/admin/orders'),
        AdminApi.get('/admin/contact-messages'),
      ]);

      const unread = messages.filter((m) => m.status === 'new').length;

      document.getElementById('stats').innerHTML =
        '<div class="admin-stat"><span>Products</span><strong>' +
        products.length +
        '</strong></div>' +
        '<div class="admin-stat"><span>Orders</span><strong>' +
        orders.length +
        '</strong></div>' +
        '<div class="admin-stat"><span>New messages</span><strong>' +
        unread +
        '</strong></div>' +
        '<div class="admin-stat"><span>Storefront</span><strong><a href="/">View site</a></strong></div>';
    } catch (err) {
      document.getElementById('stats').textContent = err.message;
    }
  },
};

AdminDashboardPage.init();
