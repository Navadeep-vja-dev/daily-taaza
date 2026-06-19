/**
 * Presentation layer — Product detail page
 */
const ProductDetailsPage = {
  async init() {
    const container = document.getElementById('pdp-content');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const product = await ProductService.getById(id);

    if (!product) {
      container.innerHTML =
        '<div class="pdp-not-found fade-in">' +
        '<h1 class="headline-lg">Product not found</h1>' +
        '<p class="body-md mt-16">Sorry, we couldn\'t find that product.</p>' +
        '<a href="' + Paths.pageHref('products.html') + '" class="btn btn-primary mt-32">Browse Products</a>' +
        '</div>';
      Animations.initReveal(container);
      return;
    }

    document.title = product.name + ' — Buy Online | Daily Taaza';

    const bc = document.getElementById('breadcrumb-product');
    if (bc) bc.textContent = product.name;

    const variants = product.variants && product.variants.length ? product.variants : [];
    let selectedVariant =
      variants.find((v) => v.isDefault) || variants[0] || { id: null, price: product.price, label: '' };

    const images =
      product.images && product.images.length
        ? product.images
        : [{ path: product.image, isPrimary: true }];

    const renderGallery = (activePath) => {
      const mainSrc = Paths.asset(activePath);
      const thumbs =
        images.length > 1
          ? images
              .map(
                (img, idx) =>
                  '<button type="button" class="pdp-thumb' +
                  (img.path === activePath ? ' active' : '') +
                  '" data-src="' +
                  Paths.asset(img.path) +
                  '" aria-label="View image ' +
                  (idx + 1) +
                  '">' +
                  '<img src="' +
                  Paths.asset(img.path) +
                  '" alt="' +
                  product.name +
                  '">' +
                  '</button>'
              )
              .join('')
          : '';

      return (
        '<div class="pdp-gallery">' +
        '<div class="pdp-gallery__main" id="pdp-main-image">' +
        '<img src="' +
        mainSrc +
        '" alt="' +
        product.name +
        '" id="pdp-main-img">' +
        '</div>' +
        (thumbs ? '<div class="pdp-gallery__thumbs">' + thumbs + '</div>' : '') +
        '</div>'
      );
    };

    const variantPills =
      variants.length > 1
        ? '<div class="pdp-variants" id="pdp-variants">' +
          variants
            .map(
              (v) =>
                '<button type="button" class="chip pdp-variant-btn' +
                (v.id === selectedVariant.id ? ' active' : '') +
                '" data-variant-id="' +
                v.id +
                '" data-price="' +
                v.price +
                '" data-compare="' +
                (v.comparePrice || '') +
                '">' +
                v.label +
                '</button>'
            )
            .join('') +
          '</div>'
        : '';

    const priceHtml = (variant) => {
      let html = ProductService.formatPrice(variant.price);
      if (variant.comparePrice && variant.comparePrice > variant.price) {
        html =
          '<span class="pdp-price-compare">' +
          ProductService.formatPrice(variant.comparePrice) +
          '</span> ' +
          html;
      }
      return html;
    };

    const badge = product.badge ? '<span class="badge">' + product.badge + '</span>' : '';
    const chip = '<span class="chip">' + CategoryRepository.getLabel(product.category) + '</span>';
    const ingredientsList = product.ingredients.map((i) => '<li>' + i + '</li>').join('');
    const benefitsList = product.benefits.map((b) => '<li>' + b + '</li>').join('');
    const primaryImage = images.find((i) => i.isPrimary)?.path || images[0].path;

    container.innerHTML =
      '<div class="pdp-grid reveal reveal--up">' +
      renderGallery(primaryImage) +
      '<div class="pdp-info">' +
      badge +
      chip +
      '<h1>' +
      product.name +
      '</h1>' +
      variantPills +
      '<p class="pdp-price" id="pdp-price">' +
      priceHtml(selectedVariant) +
      '</p>' +
      '<p class="body-md pdp-desc">' +
      product.description +
      '</p>' +
      '<div class="pdp-meta"><h3>Ingredients</h3><ul>' +
      ingredientsList +
      '</ul></div>' +
      '<div class="pdp-meta"><h3>Benefits</h3><ul>' +
      benefitsList +
      '</ul></div>' +
      '<div class="pdp-actions">' +
      '<div class="qty-selector" id="pdp-qty">' +
      '<button type="button" class="qty-btn" id="qty-minus" aria-label="Decrease">−</button>' +
      '<span class="qty-value" id="qty-value">1</span>' +
      '<button type="button" class="qty-btn" id="qty-plus" aria-label="Increase">+</button>' +
      '</div>' +
      '<button type="button" class="btn btn-commerce" id="pdp-add-cart">Add to Cart</button>' +
      '</div></div></div>';

    Animations.initReveal(container);

    let qty = 1;
    document.getElementById('qty-minus').addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        document.getElementById('qty-value').textContent = qty;
      }
    });
    document.getElementById('qty-plus').addEventListener('click', () => {
      qty++;
      document.getElementById('qty-value').textContent = qty;
    });

    container.querySelectorAll('.pdp-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        container.querySelectorAll('.pdp-thumb').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        document.getElementById('pdp-main-img').src = thumb.dataset.src;
      });
    });

    container.querySelectorAll('.pdp-variant-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.pdp-variant-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedVariant = variants.find((v) => v.id === btn.dataset.variantId);
        document.getElementById('pdp-price').innerHTML = priceHtml({
          price: Number(btn.dataset.price),
          comparePrice: btn.dataset.compare ? Number(btn.dataset.compare) : null,
        });
      });
    });

    document.getElementById('pdp-add-cart').addEventListener('click', async function () {
      await CartService.add(product.id, qty, selectedVariant.id);
      this.textContent = 'Added to Cart!';
      setTimeout(() => {
        this.textContent = 'Add to Cart';
      }, 1500);
    });

    const related = await ProductService.getRelated(product.id);
    if (related.length) {
      const section = document.getElementById('related-section');
      if (section) section.hidden = false;
      renderProductGrid(document.getElementById('related-products'), related);
    }
  },
};
