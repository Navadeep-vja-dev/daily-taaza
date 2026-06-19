/**
 * Presentation layer — Cart UI (DOM rendering)
 */
const CartUI = {
  itemKey(item) {
    return item.variantId || item.id;
  },

  updateBadge() {
    CartService.getCount().then((count) => {
      document.querySelectorAll('.cart-badge').forEach((badge) => {
        badge.textContent = count;
        badge.hidden = count === 0;
      });
    });
  },

  async renderPage() {
    const container = document.getElementById('cart-items');
    const emptyState = document.getElementById('cart-empty');
    const summary = document.getElementById('cart-summary');
    if (!container) return;

    const cart = await CartService.getItems();

    if (!cart.length) {
      container.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      if (summary) summary.hidden = true;
      return;
    }

    if (emptyState) emptyState.hidden = true;
    if (summary) summary.hidden = false;

    container.innerHTML = cart
      .map((item) => {
        const key = this.itemKey(item);
        const letter = item.name.charAt(0).toUpperCase();
        const textColor = item.placeholderText || '#2D5A27';
        const lineTotal = item.price * item.quantity;
        const imgSrc = Paths.asset(item.image);
        const variantLabel = item.variantLabel ? ' <span class="cart-item__variant">(' + item.variantLabel + ')</span>' : '';
        return (
          '<div class="cart-item" data-variant-id="' + key + '">' +
          '<div class="cart-item__main">' +
          '<div class="cart-item__image">' +
          '<img src="' + imgSrc + '" alt="' + item.name + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
          '<div class="placeholder-image placeholder-image--small" style="display:none;background-color:' + item.placeholderColor + ';color:' + textColor + '">' +
          '<span class="placeholder-image__letter">' + letter + '</span></div></div>' +
          '<div class="cart-item__body"><div class="cart-item__top">' +
          '<div class="cart-item__info"><h3 class="cart-item__name">' + item.name + variantLabel + '</h3>' +
          '<p class="cart-item__price">' + ProductService.formatPrice(item.price) + ' each</p></div>' +
          '<button type="button" class="cart-item__remove remove-btn" data-variant-id="' + key + '" aria-label="Remove item">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>' +
          '<div class="cart-item__controls"><div class="cart-item__qty">' +
          '<button type="button" class="qty-btn qty-minus" data-variant-id="' + key + '">−</button>' +
          '<span class="qty-value">' + item.quantity + '</span>' +
          '<button type="button" class="qty-btn qty-plus" data-variant-id="' + key + '">+</button></div>' +
          '<p class="cart-item__total">' + ProductService.formatPrice(lineTotal) + '</p></div></div></div></div>'
        );
      })
      .join('');

    const total = await CartService.getTotal();
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    if (subtotalEl) subtotalEl.textContent = ProductService.formatPrice(total);
    if (totalEl) totalEl.textContent = ProductService.formatPrice(total);

    this.bindControls(container);
  },

  bindControls(container) {
    container.querySelectorAll('.qty-minus').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const variantId = btn.dataset.variantId;
        const cart = await CartService.getItems();
        const item = cart.find((i) => this.itemKey(i) === variantId);
        if (item) await CartService.updateQuantity(variantId, item.quantity - 1);
        await this.renderPage();
      });
    });
    container.querySelectorAll('.qty-plus').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const variantId = btn.dataset.variantId;
        const cart = await CartService.getItems();
        const item = cart.find((i) => this.itemKey(i) === variantId);
        if (item) await CartService.updateQuantity(variantId, item.quantity + 1);
        await this.renderPage();
      });
    });
    container.querySelectorAll('.remove-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await CartService.remove(btn.dataset.variantId);
        await this.renderPage();
      });
    });
  },

  init() {
    this.updateBadge();
    window.addEventListener('cartUpdated', () => this.updateBadge());

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        window.location.href = Paths.pageHref('checkout.html');
      });
    }

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (confirm('Remove all items from your cart?')) {
          await CartService.clear();
          await this.renderPage();
        }
      });
    }
  },
};
