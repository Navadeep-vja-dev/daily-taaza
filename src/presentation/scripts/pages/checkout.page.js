/**
 * Presentation layer — Checkout page
 */
const CheckoutPage = {
  async init() {
    const form = document.getElementById('checkout-form');
    const successEl = document.getElementById('checkout-success');
    if (!form) return;

    if (CustomerAuth.isLoggedIn()) {
      try {
        const profile = await CustomerApi.getProfile();
        form.fullName.value = profile.fullName || '';
        form.phone.value = profile.phone || '';
        form.email.value = profile.email || '';
        const addresses = await CustomerApi.listAddresses();
        const addr = addresses.find((a) => a.isDefault) || addresses[0];
        if (addr) {
          form.addressLine1.value = addr.addressLine1;
          form.addressLine2.value = addr.addressLine2 || '';
          form.city.value = addr.city;
          form.pincode.value = addr.pincode;
        }
      } catch {
        /* optional prefill */
      }
    }

    const cart = await CartService.getItems();
    const summaryEl = document.getElementById('checkout-summary');
    if (!cart.length) {
      if (summaryEl) {
        summaryEl.innerHTML =
          '<p>Your cart is empty. <a href="' + Paths.pageHref('products.html') + '">Browse products</a></p>';
      }
      form.hidden = true;
      return;
    }

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    if (summaryEl) {
      summaryEl.innerHTML =
        cart
          .map(
            (i) =>
              '<p>' +
              i.name +
              (i.variantLabel ? ' (' + i.variantLabel + ')' : '') +
              ' × ' +
              i.quantity +
              ' — ' +
              ProductService.formatPrice(i.price * i.quantity) +
              '</p>'
          )
          .join('') + '<p><strong>Subtotal: ' + ProductService.formatPrice(subtotal) + '</strong></p>';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';
      const payload = {
        fullName: form.fullName.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim() || null,
        addressLine1: form.addressLine1.value.trim(),
        addressLine2: form.addressLine2.value.trim() || null,
        city: form.city.value.trim(),
        pincode: form.pincode.value.trim(),
        paymentMethod,
        notes: form.notes.value.trim() || null,
      };

      const headers = CustomerAuth.authHeaders({ 'Content-Type': 'application/json' });
      const cartToken = localStorage.getItem('dailyTaazaCartToken');
      if (cartToken) headers['X-Cart-Token'] = cartToken;

      try {
        const res = await fetch('/api/orders', { method: 'POST', headers, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Checkout failed');

        const order = json.data.order;
        form.hidden = true;
        if (successEl) {
          successEl.hidden = false;
          successEl.innerHTML =
            '<h2 class="headline-md">Order Confirmed!</h2>' +
            '<p>Order #' +
            order.orderNumber +
            ' — Total: ' +
            ProductService.formatPrice(order.total) +
            '</p>' +
            '<p>Payment: ' +
            (order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online') +
            '</p>' +
            '<a href="' +
            Paths.pageHref('orders.html') +
            '" class="btn btn-primary">View my orders</a>';
        }

        if (json.data.payment && paymentMethod === 'online') {
          alert('Online payment stub: use Razorpay keys in .env. Order #' + order.orderNumber + ' created.');
        }
      } catch (err) {
        alert(err.message || 'Checkout failed');
      }
    });
  },
};
