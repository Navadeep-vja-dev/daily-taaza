const AdminProductsPage = {
  products: [],
  categories: [],
  editingId: null,

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

  renderTable() {
    const rows = this.products
      .map(
        (p) =>
          '<tr><td>' +
          AdminLayout.escapeHtml(p.name) +
          '</td><td>₹' +
          p.price +
          '</td><td>' +
          AdminLayout.escapeHtml(p.category) +
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

  async showForm(id) {
    this.editingId = id || null;
    let p = null;
    if (id) {
      p = await AdminApi.get('/products/' + id);
    }
    const catOptions = this.categories
      .map(
        (c) =>
          '<option value="' +
          c.id +
          '"' +
          (p && p.category === c.id ? ' selected' : '') +
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
      '<label>ID<input name="id" required ' +
      (id ? 'readonly value="' + AdminLayout.escapeHtml(id) + '"' : '') +
      '></label>' +
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
      '<label>Image path<input name="image" required value="' +
      AdminLayout.escapeHtml(p?.image || '/assets/images/idli-dosa-batter.jpg') +
      '"></label>' +
      '<label>Upload image<input type="file" name="imageFile" accept="image/*"></label>' +
      '<label>Placeholder color<input name="placeholder_color" required value="' +
      AdminLayout.escapeHtml(p?.placeholderColor || '#E8F5E9') +
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
      document.getElementById('form-panel').hidden = true;
    };
    document.getElementById('btn-add-variant')?.addEventListener('click', () => {
      const editor = document.getElementById('variants-editor');
      const productId = document.querySelector('#product-form [name="id"]')?.value || 'new-product';
      const idx = editor.querySelectorAll('.variant-row').length;
      editor.insertAdjacentHTML('beforeend', this.variantRowHtml(productId + '-v' + idx, '', 0, 100, false));
    });

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

    let image = f.image.value.trim();
    const file = f.imageFile.files[0];
    if (file) {
      const uploaded = await AdminApi.uploadImage(file, this.editingId || undefined);
      image = uploaded.path.replace(/^\//, '');
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
      image,
      placeholder_color: f.placeholder_color.value.trim(),
      placeholder_text: null,
      stock_qty: parseInt(f.stock_qty.value, 10) || 0,
    };
    const variants = this.collectVariants(f, payload.id);
    if (variants) payload.variants = variants;

    try {
      if (this.editingId) await AdminApi.put('/admin/products/' + this.editingId, payload);
      else await AdminApi.post('/admin/products', payload);
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
