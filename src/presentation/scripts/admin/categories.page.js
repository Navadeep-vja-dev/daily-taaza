const AdminCategoriesPage = {
  categories: [],
  editingId: null,

  async init() {
    if (!AdminAuth.requireAuth()) return;
    AdminLayout.mount(
      'categories',
      'Categories',
      '<div class="admin-actions"><button class="admin-btn" id="btn-new">Add category</button></div>' +
        '<div class="admin-card" id="form-panel" hidden></div>' +
        '<div class="admin-card"><div id="categories-table">Loading...</div></div>'
    );
    document.getElementById('btn-new').addEventListener('click', () => this.showForm());
    await this.load();
  },

  async load() {
    this.categories = await AdminApi.get('/admin/categories');
    const rows = this.categories
      .map(
        (c) =>
          '<tr><td>' +
          AdminLayout.escapeHtml(c.id) +
          '</td><td>' +
          AdminLayout.escapeHtml(c.label) +
          '</td><td>' +
          (c.sortOrder ?? 0) +
          '</td><td class="admin-actions">' +
          '<button class="admin-btn admin-btn--secondary" data-edit="' +
          c.id +
          '">Edit</button> ' +
          '<button class="admin-btn admin-btn--danger" data-del="' +
          c.id +
          '">Delete</button></td></tr>'
      )
      .join('');

    document.getElementById('categories-table').innerHTML =
      '<table class="admin-table"><thead><tr><th>ID</th><th>Label</th><th>Sort</th><th></th></tr></thead><tbody>' +
      rows +
      '</tbody></table>';

    document.querySelectorAll('[data-edit]').forEach((btn) =>
      btn.addEventListener('click', () => this.showForm(btn.dataset.edit))
    );
    document.querySelectorAll('[data-del]').forEach((btn) =>
      btn.addEventListener('click', () => this.remove(btn.dataset.del))
    );
  },

  showForm(id) {
    this.editingId = id || null;
    const c = id ? this.categories.find((x) => x.id === id) : null;
    document.getElementById('form-panel').hidden = false;
    document.getElementById('form-panel').innerHTML =
      '<h2>' +
      (id ? 'Edit category' : 'New category') +
      '</h2>' +
      '<form class="admin-form" id="category-form">' +
      '<label>ID<input name="id" required ' +
      (id ? 'readonly value="' + AdminLayout.escapeHtml(id) + '"' : '') +
      '></label>' +
      '<label>Label<input name="label" required value="' +
      AdminLayout.escapeHtml(c?.label || '') +
      '"></label>' +
      '<label>Sort order<input name="sort_order" type="number" value="' +
      (c?.sortOrder ?? 0) +
      '"></label>' +
      '<div class="admin-actions"><button type="submit" class="admin-btn">Save</button>' +
      '<button type="button" class="admin-btn admin-btn--secondary" id="btn-cancel">Cancel</button></div>' +
      '<p class="admin-error" id="form-error"></p></form>';

    document.getElementById('btn-cancel').onclick = () => {
      document.getElementById('form-panel').hidden = true;
    };
    document.getElementById('category-form').onsubmit = (e) => this.save(e);
  },

  async save(e) {
    e.preventDefault();
    const f = e.target;
    const payload = {
      id: f.id.value.trim(),
      label: f.label.value.trim(),
      sort_order: parseInt(f.sort_order.value, 10) || 0,
      is_active: true,
    };
    try {
      if (this.editingId) await AdminApi.put('/admin/categories/' + this.editingId, payload);
      else await AdminApi.post('/admin/categories', payload);
      document.getElementById('form-panel').hidden = true;
      await this.load();
    } catch (err) {
      document.getElementById('form-error').textContent = err.message;
    }
  },

  async remove(id) {
    if (!confirm('Delete category ' + id + '?')) return;
    await AdminApi.delete('/admin/categories/' + id);
    await this.load();
  },
};

AdminCategoriesPage.init();
