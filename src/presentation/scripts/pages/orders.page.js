const OrdersPage = {
  async init() {
    if (!CustomerAuth.isLoggedIn()) {
      window.location.href = Paths.pageHref('login.html');
      return;
    }
    const listEl = document.getElementById('orders-list');
    try {
      const orders = await CustomerApi.listOrders();
      if (!orders.length) {
        listEl.innerHTML = '<p>No orders yet. <a href="' + Paths.pageHref('products.html') + '">Start shopping</a></p>';
        return;
      }
      listEl.innerHTML =
        '<table class="admin-table" style="width:100%"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' +
        orders
          .map((o) => {
            const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—';
            return (
              '<tr><td>' +
              o.orderNumber +
              '</td><td>' +
              date +
              '</td><td>' +
              ProductService.formatPrice(o.total) +
              '</td><td><span class="badge">' +
              o.status +
              '</span></td><td><a href="order-details.html?order=' +
              encodeURIComponent(o.orderNumber) +
              '">View</a></td></tr>'
            );
          })
          .join('') +
        '</tbody></table>';
    } catch (err) {
      listEl.innerHTML = '<p class="admin-error">' + err.message + '</p>';
    }
  },
};
