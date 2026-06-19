const AdminOrdersPage = {
  async init() {
    if (!AdminAuth.requireAuth()) return;
    AdminLayout.mount('orders', 'Orders', '<div class="admin-card"><div id="orders-table">Loading...</div></div>');
    await this.load();
  },

  async load() {
    const orders = await AdminApi.get('/admin/orders');
    const statuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

    const rows = orders
      .map((o) => {
        const opts = statuses
          .map((s) => '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + s + '</option>')
          .join('');
        return (
          '<tr><td>' +
          AdminLayout.escapeHtml(o.orderNumber) +
          '</td><td>' +
          AdminLayout.escapeHtml(o.deliveryName) +
          '</td><td>₹' +
          o.total +
          '</td><td>' +
          AdminLayout.escapeHtml(o.paymentMethod) +
          '</td><td><select data-order="' +
          o.orderNumber +
          '">' +
          opts +
          '</select></td></tr>'
        );
      })
      .join('');

    document.getElementById('orders-table').innerHTML =
      '<table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>' +
      rows +
      '</tbody></table>';

    document.querySelectorAll('select[data-order]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await AdminApi.put('/admin/orders/' + sel.dataset.order + '/status', { status: sel.value });
        } catch (err) {
          alert(err.message);
          await this.load();
        }
      });
    });
  },
};

AdminOrdersPage.init();
