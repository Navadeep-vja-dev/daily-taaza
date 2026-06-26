/**
 * Admin — shared layout shell
 */
const AdminLayout = {
  nav: [
    { id: 'dashboard', label: 'Dashboard', href: 'index.html' },
    { id: 'products', label: 'Products', href: 'products.html' },
    { id: 'categories', label: 'Categories', href: 'categories.html' },
    { id: 'orders', label: 'Orders', href: 'orders.html' },
    { id: 'messages', label: 'Messages', href: 'messages.html' },
  ],

  renderShell(activeId, title, contentHtml) {
    const nav = this.nav
      .map(
        (item) =>
          '<a href="' +
          item.href +
          '" class="admin-nav__link' +
          (item.id === activeId ? ' admin-nav__link--active' : '') +
          '">' +
          item.label +
          '</a>'
      )
      .join('');

    return (
      '<div class="admin-app">' +
      '<aside class="admin-sidebar">' +
      '<div class="admin-brand"><a href="index.html"><img src="/assets/images/dailytaaza-logo.png" alt="Daily Taaza" class="admin-logo-img"><span>Daily Taaza</span></a><span class="admin-brand__sub">Admin</span></div>' +
      '<nav class="admin-nav">' +
      nav +
      '</nav>' +
      '<button type="button" class="admin-logout" id="admin-logout">Logout</button>' +
      '</aside>' +
      '<main class="admin-main">' +
      '<header class="admin-header"><h1>' +
      title +
      '</h1><div id="admin-user" class="admin-user"></div></header>' +
      '<div class="admin-content">' +
      contentHtml +
      '</div>' +
      '</main></div>'
    );
  },

  mount(activeId, title, contentHtml) {
    document.body.innerHTML = this.renderShell(activeId, title, contentHtml);
    document.getElementById('admin-logout')?.addEventListener('click', () => AdminAuth.logout());
    AdminAuth.getProfile()
      .then((user) => {
        const el = document.getElementById('admin-user');
        if (el) el.textContent = user.fullName || user.email;
      })
      .catch(() => {});
  },

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};
