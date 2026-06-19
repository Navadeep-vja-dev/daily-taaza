/**
 * Daily Taaza — Header, navigation & search
 */
const Navigation = {
  initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  },

  getMobileElements() {
    return {
      toggle: document.querySelector('.menu-toggle'),
      nav: document.getElementById('nav-mobile') || document.querySelector('.nav-mobile'),
      overlay: document.getElementById('menu-overlay') || document.querySelector('.menu-overlay'),
    };
  },

  closeMobileMenu() {
    const { toggle, nav, overlay } = this.getMobileElements();
    if (!nav || !toggle) return;

    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    nav.setAttribute('aria-hidden', 'true');

    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }

    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  },

  openMobileMenu() {
    const { toggle, nav, overlay } = this.getMobileElements();
    if (!nav || !toggle) return;

    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    nav.setAttribute('aria-hidden', 'false');

    if (overlay) {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
    }

    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    this.setActiveNav();
  },

  initMobileMenu() {
    const { toggle, nav, overlay } = this.getMobileElements();
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      if (isOpen) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    });

    nav.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');

    if (overlay) {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.addEventListener('click', () => this.closeMobileMenu());
    }

    nav.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => this.closeMobileMenu());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        this.closeMobileMenu();
        toggle.focus();
      }
    });
  },

  initSearch() {
    const searchToggle = document.querySelector('.search-toggle');
    const searchBar = document.querySelector('.search-bar');
    const searchForm = document.querySelector('.search-form');
    if (!searchToggle || !searchBar) return;

    searchToggle.addEventListener('click', () => {
      const isOpen = searchBar.classList.toggle('open');
      searchToggle.setAttribute('aria-expanded', isOpen);
      if (isOpen) {
        const input = searchBar.querySelector('input');
        if (input) input.focus();
      }
    });

    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = searchForm.querySelector('input');
        const q = input ? input.value.trim() : '';
        const base = Paths.isSubPage() ? '' : 'pages/';
        window.location.href = base + 'products.html' + (q ? '?q=' + encodeURIComponent(q) : '');
      });
    }
  },

  /** Map current URL to a single nav id (one active item only). */
  getCurrentNavId() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const page = currentPage.split('?')[0];

    const pageToNav = {
      '': 'home',
      'index.html': 'home',
      'products.html': 'products',
      'product-details.html': 'products',
      'about.html': 'about',
      'contact.html': 'contact',
      'cart.html': 'cart',
    };

    return pageToNav[page] || null;
  },

  setActiveNav() {
    const currentNavId = this.getCurrentNavId();

    document.querySelectorAll('.nav-desktop, .nav-mobile').forEach((nav) => {
      const links = nav.querySelectorAll('.nav-link');

      links.forEach((link) => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      });

      if (!currentNavId) return;

      const activeLink = nav.querySelector('.nav-link[data-nav="' + currentNavId + '"]');
      if (activeLink) {
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
      }
    });
  },

  init() {
    this.initHeader();
    this.initMobileMenu();
    this.initSearch();
    this.setActiveNav();
  },
};
