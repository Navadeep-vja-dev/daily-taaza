/**
 * Presentation layer — Product rendering UI
 */

function renderPlaceholder(product, className = 'placeholder-image', hidden = false) {
  const letter = product.name.charAt(0).toUpperCase();
  const textColor = product.placeholderText || '#2D5A27';
  const display = hidden ? 'display:none;' : '';
  return (
    '<div class="' + className + '" style="' + display + 'background-color:' + product.placeholderColor + ';color:' + textColor + '">' +
    '<span class="placeholder-image__letter">' + letter + '</span>' +
    '</div>'
  );
}

function renderProductImage(product, className = 'card__image') {
  const src = Paths.asset(product.image);
  const placeholder = renderPlaceholder(product, 'placeholder-image placeholder-image--card', true);
  return (
    '<div class="' + className + '">' +
    '<img src="' + src + '" alt="' + product.name + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
    placeholder +
    '</div>'
  );
}

function productDetailUrl(productId) {
  const base = Paths.isSubPage() ? '' : 'pages/';
  return base + 'product-details.html?id=' + productId;
}

function renderProductCard(product) {
  const detailUrl = productDetailUrl(product.id);
  const badge = product.badge ? '<span class="badge">' + product.badge + '</span>' : '';
  const chip = '<span class="chip">' + CategoryRepository.getLabel(product.category) + '</span>';

  return (
    '<article class="card product-card reveal reveal--up" data-reveal>' +
    '<a href="' + detailUrl + '" class="card__link">' +
    renderProductImage(product) +
    '<div class="card__body">' +
    '<div class="card__meta">' + badge + chip + '</div>' +
    '<h3 class="card__title">' + product.name + '</h3>' +
    '<p class="card__price">' + ProductService.formatPrice(product.price) + '</p>' +
    '</div></a>' +
    '<div class="card__actions">' +
    '<button type="button" class="btn btn-commerce btn-sm add-to-cart-btn" data-id="' + product.id + '">Add to Cart</button>' +
    '</div></article>'
  );
}

function renderProductGrid(container, products) {
  if (!container) return;
  if (!products.length) {
    container.innerHTML = '<p class="empty-message">No products found. Try adjusting your filters.</p>';
    return;
  }
  container.innerHTML = products.map((p) => renderProductCard(p)).join('');
  bindAddToCartButtons(container);
  if (typeof Animations !== 'undefined') Animations.initReveal(container);
}

function bindAddToCartButtons(container) {
  if (!container) return;
  container.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await CartService.add(btn.dataset.id);
      btn.textContent = 'Added!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Add to Cart';
        btn.disabled = false;
      }, 1200);
    });
  });
}
