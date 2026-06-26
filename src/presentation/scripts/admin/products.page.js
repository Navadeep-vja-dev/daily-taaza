const AdminProductsPage = {
  products: [],
  categories: [],
  editingId: null,
  existingImages: [],
  pendingFiles: [],
  pendingPreviewUrls: [],

  async init() {
    if (!AdminAuth.requireAuth()) return;
    AdminLayout.mount(
      'products',
      'Products',
      '<div class="admin-actions"><button class="admin-btn" id="btn-new">Add product</button></div>' +
        '<div class="admin-card" id="form-panel" hidden></div>' +
        '<div class="admin-card"><div id="products-table">Loading...</div></div>'
    );

    document.getElementById('btn-new').addEventListener('click', () => this.showForm());
    await this.load();
  },

  async load() {
    [this.products, this.categories] = await Promise.all([
      AdminApi.get('/admin/products'),
      AdminApi.get('/admin/categories'),
    ]);
    this.renderTable();
  },

  categoryLabel(categoryId) {
    const c = this.categories.find((x) => String(x.id) === String(categoryId));
    return c ? c.label : String(categoryId ?? '');
  },

  renderTable() {
    const rows = this.products
      .map(
        (p) =>
          '<tr><td>' +
          AdminLayout.escapeHtml(p.name) +
          '</td><td>₹' +
          p.price +
          '</td><td>' +
          AdminLayout.escapeHtml(this.categoryLabel(p.category)) +
          '</td><td>' +
          (p.stockQty ?? '-') +
          '</td><td class="admin-actions">' +
          '<button class="admin-btn admin-btn--secondary" data-edit="' +
          p.id +
          '">Edit</button> ' +
          '<button class="admin-btn admin-btn--danger" data-del="' +
          p.id +
          '">Delete</button></td></tr>'
      )
      .join('');

    document.getElementById('products-table').innerHTML =
      '<table class="admin-table"><thead><tr><th>Name</th><th>Price</th><th>Category</th><th>Stock</th><th></th></tr></thead><tbody>' +
      rows +
      '</tbody></table>';

    document.querySelectorAll('[data-edit]').forEach((btn) =>
      btn.addEventListener('click', () => this.showForm(btn.dataset.edit))
    );
    document.querySelectorAll('[data-del]').forEach((btn) =>
      btn.addEventListener('click', () => this.remove(btn.dataset.del))
    );
  },

  clearPendingFiles() {
    this.pendingPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    this.pendingFiles = [];
    this.pendingPreviewUrls = [];
  },

  imageSrc(path) {
    if (!path) return '';
    return path.startsWith('/') ? path : '/' + path;
  },

  renderImageGallery() {
    const existing = this.existingImages
      .map(
        (img) =>
          '<div class="admin-image-card' +
          (img.isPrimary ? ' admin-image-card--primary' : '') +
          '" data-image-id="' +
          img.id +
          '">' +
          '<img src="' +
          AdminLayout.escapeHtml(this.imageSrc(img.path)) +
          '" alt="Product image">' +
          '<div class="admin-image-card__actions">' +
          (img.isPrimary
            ? '<span class="admin-image-card__badge">Primary</span>'
            : '<button type="button" class="admin-btn admin-btn--secondary admin-btn--sm" data-set-primary="' +
              img.id +
              '">Set primary</button>') +
          '<button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-remove-existing="' +
          img.id +
          '">Remove</button>' +
          '</div></div>'
      )
      .join('');

    const pending = this.pendingFiles
      .map(
        (file, index) =>
          '<div class="admin-image-card admin-image-card--pending" data-pending-index="' +
          index +
          '">' +
          '<img src="' +
          AdminLayout.escapeHtml(this.pendingPreviewUrls[index]) +
          '" alt="Selected image">' +
          '<div class="admin-image-card__actions">' +
          '<span class="admin-image-card__badge">New</span>' +
          '<button type="button" class="admin-btn admin-btn--danger admin-btn--sm" data-remove-pending="' +
          index +
          '">Remove</button>' +
          '</div></div>'
      )
      .join('');

    const total = this.existingImages.length + this.pendingFiles.length;
    const empty =
      total === 0
        ? '<p class="admin-image-hint">Upload at least one JPG, JPEG, PNG, or WEBP image (max 5 MB each, up to 10 total).</p>'
        : '';

    return (
      '<div class="admin-image-section">' +
      empty +
      '<div class="admin-image-gallery">' +
      existing +
      pending +
      '</div>' +
      '<p class="admin-image-hint">' +
      total +
      ' / ' +
      AdminApi.maxProductImages +
      ' images</p></div>'
    );
  },

  bindImageGalleryEvents() {
    document.querySelectorAll('[data-remove-pending]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.removePending, 10);
        URL.revokeObjectURL(this.pendingPreviewUrls[index]);
        this.pendingFiles.splice(index, 1);
        this.pendingPreviewUrls.splice(index, 1);
        this.refreshImageGallery();
      });
    });

    document.querySelectorAll('[data-remove-existing]').forEach((btn) => {
      btn.addEventListener('click', () => this.removeExistingImage(btn.dataset.removeExisting));
    });

    document.querySelectorAll('[data-set-primary]').forEach((btn) => {
      btn.addEventListener('click', () => this.setPrimaryImage(btn.dataset.setPrimary));
    });
  },

  refreshImageGallery() {
    const gallery = document.getElementById('image-gallery');
    if (!gallery) return;
    gallery.innerHTML = this.renderImageGallery();
    this.bindImageGalleryEvents();
  },

  validateSelectedFiles(files) {
    const total = this.existingImages.length + this.pendingFiles.length + files.length;
    if (total > AdminApi.maxProductImages) {
      throw new Error('Maximum ' + AdminApi.maxProductImages + ' images per product');
    }

    const maxBytes = AdminApi.maxImageSizeMb * 1024 * 1024;
    for (const file of files) {
      if (!AdminApi.allowedImageTypes.includes(file.type)) {
        throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed');
      }
      if (file.size > maxBytes) {
        throw new Error('Each image must be at most ' + AdminApi.maxImageSizeMb + ' MB');
      }
    }
  },

  onFilesSelected(fileList) {
    const errEl = document.getElementById('form-error');
    errEl.textContent = '';
    const files = Array.from(fileList || []);
    if (!files.length) return;

    try {
      this.validateSelectedFiles(files);
      files.forEach((file) => {
        this.pendingFiles.push(file);
        this.pendingPreviewUrls.push(URL.createObjectURL(file));
      });
      this.refreshImageGallery();
      const input = document.getElementById('product-images-input');
      if (input) input.value = '';
    } catch (err) {
      errEl.textContent = err.message;
    }
  },

  async removeExistingImage(imageId) {
    if (!this.editingId) return;
    const errEl = document.getElementById('form-error');
    errEl.textContent = '';

    try {
      const result = await AdminApi.deleteProductImage(this.editingId, imageId);
      this.existingImages = result.images || [];
      this.refreshImageGallery();
    } catch (err) {
      errEl.textContent = err.message;
    }
  },

  async setPrimaryImage(imageId) {
    if (!this.editingId) return;
    const errEl = document.getElementById('form-error');
    errEl.textContent = '';

    try {
      await AdminApi.setPrimaryImage(this.editingId, imageId);
      this.existingImages = this.existingImages.map((img) => ({
        ...img,
        isPrimary: img.id === Number(imageId),
      }));
      this.refreshImageGallery();
    } catch (err) {
      errEl.textContent = err.message;
    }
  },

  async showForm(id) {
    this.editingId = id || null;
    this.clearPendingFiles();
    this.existingImages = [];

    let p = null;
    let nextId = '';
    if (id) {
      p = await AdminApi.get('/products/' + id);
      this.existingImages = p.images || [];
    } else {
      try {
        const reserved = await AdminApi.get('/admin/products/next-id');
        nextId = reserved.id;
      } catch {
        nextId = '';
      }
    }

    const catOptions = this.categories
      .filter((c) => c.isActive !== false || (p && String(p.category) === String(c.id)))
      .map(
        (c) =>
          '<option value="' +
          c.id +
          '"' +
          (p && String(p.category) === String(c.id) ? ' selected' : '') +
          '>' +
          AdminLayout.escapeHtml(c.label) +
          '</option>'
      )
      .join('');

    document.getElementById('form-panel').hidden = false;
    document.getElementById('form-panel').innerHTML =
      '<h2>' +
      (id ? 'Edit product' : 'New product') +
      '</h2>' +
      '<form class="admin-form" id="product-form">' +
      '<label>Product ID<input name="id" required readonly value="' +
      AdminLayout.escapeHtml(id || nextId) +
      '"></label>' +
      (id ? '' : '<p class="admin-image-hint">Product ID is assigned automatically and never reused.</p>') +
      '<label>Name<input name="name" required value="' +
      AdminLayout.escapeHtml(p?.name) +
      '"></label>' +
      '<label>Slug<input name="slug" required value="' +
      AdminLayout.escapeHtml(p?.slug || p?.id || '') +
      '"></label>' +
      '<label>Category<select name="category_id" required>' +
      catOptions +
      '</select></label>' +
      '<label>Price<input name="price" type="number" step="0.01" required value="' +
      (p?.price || '') +
      '"></label>' +
      '<label>Badge<input name="badge" value="' +
      AdminLayout.escapeHtml(p?.badge || '') +
      '"></label>' +
      '<label>Description<textarea name="description" rows="3" required>' +
      AdminLayout.escapeHtml(p?.description || '') +
      '</textarea></label>' +
      '<label>Ingredients (comma-separated)<input name="ingredients" value="' +
      AdminLayout.escapeHtml((p?.ingredients || []).join(', ')) +
      '"></label>' +
      '<label>Benefits (comma-separated)<input name="benefits" value="' +
      AdminLayout.escapeHtml((p?.benefits || []).join(', ')) +
      '"></label>' +
      '<div class="admin-form__images">' +
      '<span class="admin-form__images-label">Product images</span>' +
      '<div id="image-gallery">' +
      this.renderImageGallery() +
      '</div>' +
      '<label class="admin-file-input">' +
      '<span>Upload images</span>' +
      '<input type="file" id="product-images-input" name="images" multiple accept="image/jpeg,image/jpg,image/png,image/webp">' +
      '</label>' +
      '</div>' +
      '<label>Placeholder color<input name="placeholder_color" required value="' +
      AdminLayout.escapeHtml(p?.placeholderColor || '#E6F4F1') +
      '"></label>' +
      '<label>Stock<input name="stock_qty" type="number" value="' +
      (p?.stockQty ?? 100) +
      '"></label>' +
      '<h3>Variants</h3><div id="variants-editor">' +
      this.renderVariantsEditor(p?.variants || []) +
      '</div>' +
      '<button type="button" class="admin-btn admin-btn--secondary" id="btn-add-variant">Add variant</button>' +
      '<div class="admin-actions"><button type="submit" class="admin-btn">Save</button>' +
      '<button type="button" class="admin-btn admin-btn--secondary" id="btn-cancel">Cancel</button></div>' +
      '<p class="admin-error" id="form-error"></p></form>';

    document.getElementById('btn-cancel').onclick = () => {
      this.clearPendingFiles();
      document.getElementById('form-panel').hidden = true;
    };
    document.getElementById('btn-add-variant')?.addEventListener('click', () => {
      const editor = document.getElementById('variants-editor');
      const productId = document.querySelector('#product-form [name="id"]')?.value || 'new-product';
      const idx = editor.querySelectorAll('.variant-row').length;
      editor.insertAdjacentHTML('beforeend', this.variantRowHtml(productId + '-v' + idx, '', 0, 100, false));
    });

    document.getElementById('product-images-input').addEventListener('change', (e) => {
      this.onFilesSelected(e.target.files);
    });

    this.bindImageGalleryEvents();
    document.getElementById('product-form').onsubmit = (e) => this.save(e);
  },

  renderVariantsEditor(variants) {
    if (!variants.length) {
      return '<p class="body-sm">Default 500g / 1kg variants are created on save if none listed.</p>';
    }
    return variants.map((v, i) => this.variantRowHtml(v.id, v.label, v.price, v.stockQty, v.isDefault)).join('');
  },

  variantRowHtml(id, label, price, stock, isDefault) {
    return (
      '<div class="variant-row admin-form" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr auto;gap:8px;margin-bottom:8px">' +
      '<input name="variant_id" value="' + AdminLayout.escapeHtml(id) + '" placeholder="ID" required>' +
      '<input name="variant_label" value="' + AdminLayout.escapeHtml(label) + '" placeholder="Label" required>' +
      '<input name="variant_price" type="number" step="0.01" value="' + price + '" placeholder="Price" required>' +
      '<input name="variant_stock" type="number" value="' + stock + '" placeholder="Stock">' +
      '<label><input type="radio" name="variant_default" value="' + AdminLayout.escapeHtml(id) + '"' + (isDefault ? ' checked' : '') + '> Default</label>' +
      '</div>'
    );
  },

  collectVariants(form, productId) {
    const rows = form.querySelectorAll('.variant-row');
    if (!rows.length) return null;
    const defaultId = form.querySelector('input[name="variant_default"]:checked')?.value;
    return Array.from(rows).map((row, i) => ({
      id: row.querySelector('[name="variant_id"]').value.trim(),
      label: row.querySelector('[name="variant_label"]').value.trim(),
      price: parseFloat(row.querySelector('[name="variant_price"]').value),
      stock_qty: parseInt(row.querySelector('[name="variant_stock"]').value, 10) || 0,
      is_default: row.querySelector('[name="variant_id"]').value.trim() === defaultId,
      sort_order: i,
    }));
  },

  async save(e) {
    e.preventDefault();
    const f = e.target;
    const errEl = document.getElementById('form-error');
    errEl.textContent = '';

    const totalImages = this.existingImages.length + this.pendingFiles.length;
    if (totalImages === 0) {
      errEl.textContent = 'Please upload at least one product image';
      return;
    }

    const payload = {
      id: f.id.value.trim(),
      category_id: f.category_id.value,
      name: f.name.value.trim(),
      slug: f.slug.value.trim(),
      price: parseFloat(f.price.value),
      badge: f.badge.value.trim() || null,
      description: f.description.value.trim(),
      ingredients: f.ingredients.value.split(',').map((s) => s.trim()).filter(Boolean),
      benefits: f.benefits.value.split(',').map((s) => s.trim()).filter(Boolean),
      placeholder_color: f.placeholder_color.value.trim(),
      placeholder_text: null,
      stock_qty: parseInt(f.stock_qty.value, 10) || 0,
    };
    const variants = this.collectVariants(f, payload.id);
    if (variants) payload.variants = variants;

    try {
      let productId = this.editingId;
      if (this.editingId) {
        await AdminApi.put('/admin/products/' + this.editingId, payload);
      } else {
        const created = await AdminApi.post('/admin/products', payload);
        productId = created.id;
      }

      if (this.pendingFiles.length) {
        const uploadResult = await AdminApi.uploadImages(productId, this.pendingFiles);
        this.existingImages = uploadResult.images || uploadResult.uploaded || [];
      }

      this.clearPendingFiles();
      document.getElementById('form-panel').hidden = true;
      await this.load();
    } catch (err) {
      errEl.textContent = err.message;
    }
  },

  async remove(id) {
    if (!confirm('Delete product ' + id + '?')) return;
    await AdminApi.delete('/admin/products/' + id);
    await this.load();
  },
};

AdminProductsPage.init();
