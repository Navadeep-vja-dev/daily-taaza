const OrderDetailsPage = {
  async init() {
    if (!CustomerAuth.isLoggedIn()) {
      window.location.href = Paths.pageHref('login.html');
      return;
    }
    const orderNumber = new URLSearchParams(window.location.search).get('order');
    const container = document.getElementById('order-details');
    if (!orderNumber) {
      container.innerHTML = '<p>Order not specified.</p>';
      return;
    }

    try {
      const order = await CustomerApi.getOrder(orderNumber);
      const itemsHtml = (order.items || [])
        .map(
          (i) =>
            '<li>' +
            i.name +
            (i.variantLabel ? ' (' + i.variantLabel + ')' : '') +
            ' × ' +
            i.quantity +
            ' — ' +
            ProductService.formatPrice(i.lineTotal || i.price * i.quantity) +
            '</li>'
        )
        .join('');

      const canCancel = ['pending', 'confirmed'].includes(order.status);
      container.innerHTML =
        '<div class="contact-form-card">' +
        '<h1 class="headline-md">Order ' +
        order.orderNumber +
        '</h1>' +
        '<p>Status: <strong>' +
        order.status +
        '</strong></p>' +
        '<p>Total: ' +
        ProductService.formatPrice(order.total) +
        '</p>' +
        '<p>Delivery: ' +
        order.deliveryAddress +
        '</p>' +
        '<h3>Items</h3><ul>' +
        itemsHtml +
        '</ul>' +
        '<div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">' +
        (canCancel
          ? '<button type="button" class="btn btn-secondary" id="cancel-order-btn">Cancel order</button>'
          : '') +
        '<button type="button" class="btn btn-commerce" id="reorder-btn">Reorder</button>' +
        '</div></div>';

      const cancelBtn = document.getElementById('cancel-order-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
          if (!confirm('Cancel this order?')) return;
          await CustomerApi.cancelOrder(orderNumber);
          window.location.reload();
        });
      }
      document.getElementById('reorder-btn').addEventListener('click', async () => {
        await CustomerApi.reorder(orderNumber);
        window.location.href = Paths.pageHref('cart.html');
      });
    } catch (err) {
      container.innerHTML = '<p class="admin-error">' + err.message + '</p>';
    }
  },
};
