/**
 * Customer session (phone + password JWT)
 */
const CustomerAuth = {
  TOKEN_KEY: 'dailyTaazaCustomerToken',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    if (token) localStorage.setItem(this.TOKEN_KEY, token);
    else localStorage.removeItem(this.TOKEN_KEY);
  },

  isLoggedIn() {
    return Boolean(this.getToken());
  },

  logout() {
    this.setToken(null);
    window.location.href = Paths.pageHref('login.html');
  },

  authHeaders(extra = {}) {
    const h = { ...extra };
    const token = this.getToken();
    if (token) h.Authorization = 'Bearer ' + token;
    return h;
  },

  updateNavLink() {
    const loggedIn = this.isLoggedIn();
    const href = Paths.pageHref(loggedIn ? 'account.html' : 'login.html');
    const label = loggedIn ? 'Account' : 'Login';
    document.querySelectorAll('#account-nav-link, #account-nav-link-mobile').forEach((link) => {
      link.textContent = label;
      link.href = href;
    });
  },

  init() {
    this.updateNavLink();
    window.addEventListener('customerAuthChanged', () => this.updateNavLink());
  },
};
