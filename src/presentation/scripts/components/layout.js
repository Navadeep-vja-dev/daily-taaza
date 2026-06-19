/**
 * Daily Taaza — Shared layout (header, footer, chrome)
 */
const Layout = {
  pageHref(filename) {
    if (filename === 'index.html') {
      return Paths.isSubPage() ? '../index.html' : 'index.html';
    }
    return Paths.isSubPage() ? filename : 'pages/' + filename;
  },

  categoryHref(category) {
    const base = Paths.isSubPage() ? '' : 'pages/';
    return base + 'products.html?category=' + category;
  },

  renderChrome() {
    return (
      '<a href="#main-content" class="skip-link">Skip to main content</a>' +
      '<div class="scroll-progress" role="progressbar" aria-valuenow="0" aria-label="Page scroll progress"></div>' +
      '<div class="page-loader" aria-hidden="true">' +
      '<div class="page-loader__inner">' +
      '<p class="page-loader__logo">' + SiteConfig.name + '</p>' +
      '<div class="page-loader__bar"><span></span></div>' +
      '</div></div>'
    );
  },

  renderHeader(options = {}) {
    const scrolled = options.headerScrolled ? ' scrolled' : '';
    const searchId = options.searchId ? ' id="' + options.searchId + '"' : '';
    const home = this.pageHref('index.html');
    const cart = this.pageHref('cart.html');

    const navLinks = SiteConfig.nav
      .map((item) => {
        const href = item.id === 'home' ? home : this.pageHref(item.file);
        return (
          '<a href="' + href + '" class="nav-link" data-nav="' + item.id + '">' + item.label + '</a>'
        );
      })
      .join('');

    const mobileLinks =
      navLinks +
      '<a href="' + this.pageHref('login.html') + '" class="nav-link" id="account-nav-link-mobile" data-nav="account">Login</a>' +
      '<a href="' + cart + '" class="nav-link" data-nav="cart">Cart</a>';

    return (
      '<header class="site-header' + scrolled + '">' +
      '<div class="container header-inner">' +
      '<a href="' + home + '" class="logo" aria-label="' + SiteConfig.name + ' Home">' +
      '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<path d="M16 4C12 4 8 8 8 14c0 6 4 14 8 14s8-8 8-14c0-6-4-10-8-10z" fill="currentColor" opacity="0.2"/>' +
      '<path d="M16 6c-3 0-6 3-6 8 0 4 2 10 6 10s6-6 6-10c0-5-3-8-6-8z" fill="currentColor"/>' +
      '<path d="M16 22v6M13 25h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '</svg><span>' + SiteConfig.name + '</span></a>' +
      '<nav class="nav-desktop" aria-label="Main navigation">' +
      navLinks +
      '<a href="' + this.pageHref('login.html') + '" class="nav-link" id="account-nav-link" data-nav="account">Login</a>' +
      '</nav>' +
      '<div class="header-actions">' +
      '<button type="button" class="icon-btn theme-toggle" aria-label="Switch to dark mode">' +
      '<svg class="icon-sun" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' +
      '<svg class="icon-moon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
      '</button>' +
      '<button type="button" class="icon-btn search-toggle" aria-label="Search" aria-expanded="false">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
      '</button>' +
      '<a href="' + cart + '" class="icon-btn" aria-label="Shopping cart">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' +
      '<span class="cart-badge" hidden>0</span></a>' +
      '<button type="button" class="icon-btn menu-toggle" aria-label="Open menu" aria-expanded="false">' +
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
      '</button></div></div>' +
      '<div class="search-bar" role="search">' +
      '<form class="search-form">' +
      '<input type="search" class="input"' + searchId + ' placeholder="Search products..." aria-label="Search products">' +
      '<button type="submit" class="btn btn-primary">Search</button>' +
      '</form></div>' +
      '</header>' +
      '<div class="menu-overlay" id="menu-overlay" aria-hidden="true"></div>' +
      '<nav class="nav-mobile" id="nav-mobile" aria-label="Mobile navigation" aria-hidden="true">' +
      '<div class="nav-mobile__inner">' +
      '<p class="nav-mobile__heading">' + SiteConfig.name + '</p>' +
      '<div class="nav-mobile__links">' + mobileLinks + '</div>' +
      '</div></nav>'
    );
  },

  renderFooter(variant = 'full') {
    const home = this.pageHref('index.html');
    const year = new Date().getFullYear();

    if (variant === 'minimal') {
      return (
        '<footer class="site-footer">' +
        '<div class="container">' +
        '<div class="footer-bottom" style="border:none;padding:0">' +
        '<p>&copy; ' + year + ' ' + SiteConfig.name + '. All rights reserved.</p>' +
        '</div></div></footer>'
      );
    }

    return (
      '<footer class="site-footer">' +
      '<div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand">' +
      '<a href="' + home + '" class="logo">' +
      '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<path d="M16 6c-3 0-6 3-6 8 0 4 2 10 6 10s6-6 6-10c0-5-3-8-6-8z" fill="#ffffff"/>' +
      '</svg><span>' + SiteConfig.name + '</span></a>' +
      '<p>' + SiteConfig.tagline + '. Organic homemade South Indian foods, crafted with love and delivered fresh.</p>' +
      '</div>' +
      '<div class="footer-col"><h4>Shop</h4>' +
      '<a href="' + this.pageHref('products.html') + '">All Products</a>' +
      '<a href="' + this.categoryHref('batters') + '">Batters</a>' +
      '<a href="' + this.categoryHref('karapodulu') + '">Karapodulu</a>' +
      '<a href="' + this.categoryHref('healthy-ladoos') + '">Healthy Ladoos</a>' +
      '</div>' +
      '<div class="footer-col"><h4>Company</h4>' +
      '<a href="' + this.pageHref('about.html') + '">About Us</a>' +
      '<a href="' + this.pageHref('contact.html') + '">Contact</a>' +
      '<a href="' + this.pageHref('cart.html') + '">Cart</a>' +
      '</div>' +
      '<div class="footer-col"><h4>Contact</h4>' +
      '<a href="mailto:' + SiteConfig.email + '">' + SiteConfig.email + '</a>' +
      '<a href="tel:' + SiteConfig.phoneTel + '">' + SiteConfig.phone + '</a>' +
      '<span style="display:block;padding:6px 0;font-size:15px">' + SiteConfig.address + '</span>' +
      '</div></div>' +
      '<div class="footer-bottom">' +
      '<p>&copy; ' + year + ' ' + SiteConfig.name + '. All rights reserved.</p>' +
      '<p>Made with care, from our kitchen to yours.</p>' +
      '</div></div></footer>'
    );
  },

  renderBackToTop() {
    return (
      '<button type="button" class="back-to-top" aria-label="Back to top">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
      '<polyline points="18 15 12 9 6 15"/></svg></button>'
    );
  },

  init() {
    const body = document.body;
    const main = document.getElementById('main-content');
    if (!main) return;

    const headerScrolled = body.dataset.headerScrolled === 'true';
    const footerVariant = body.dataset.footer || 'full';
    const searchId = body.dataset.searchId || '';

    const chromeHost = document.createElement('div');
    chromeHost.innerHTML = this.renderChrome();
    while (chromeHost.firstChild) {
      body.insertBefore(chromeHost.firstChild, main);
    }

    const headerHost = document.createElement('div');
    headerHost.innerHTML = this.renderHeader({ headerScrolled, searchId });
    while (headerHost.firstChild) {
      body.insertBefore(headerHost.firstChild, main);
    }

    const footerHost = document.createElement('div');
    footerHost.innerHTML = this.renderFooter(footerVariant);
    body.appendChild(footerHost.firstChild);

    const chromeEnd = document.createElement('div');
    chromeEnd.innerHTML = this.renderBackToTop();
    body.appendChild(chromeEnd.firstChild);
  },
};
