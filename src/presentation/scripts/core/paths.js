/**
 * Presentation layer — Path helpers for root vs /pages/
 */
const Paths = {
  isSubPage() {
    return window.location.pathname.includes('/pages/');
  },

  root() {
    return this.isSubPage() ? '..' : '.';
  },

  pages() {
    return this.isSubPage() ? '.' : 'pages';
  },

  url(path) {
    if (path.startsWith('http') || path.startsWith('#')) return path;
    if (path.startsWith('pages/') && this.isSubPage()) {
      return path.replace(/^pages\//, '');
    }
    if (!path.startsWith('pages/') && !path.startsWith('../') && path !== 'index.html' && this.isSubPage() && path.endsWith('.html')) {
      return path;
    }
    if (path === 'index.html') {
      return this.isSubPage() ? '../index.html' : 'index.html';
    }
    return path;
  },

  asset(relativePath) {
    if (!relativePath) return '';
    if (relativePath.startsWith('http') || relativePath.startsWith('/')) return relativePath;
    const prefix = this.isSubPage() && relativePath.startsWith('assets/') ? '../' : '';
    return prefix + relativePath;
  },

  pageHref(filename) {
    if (filename === 'index.html') {
      return this.isSubPage() ? '../index.html' : 'index.html';
    }
    return this.isSubPage() ? filename : 'pages/' + filename;
  },

  css(file) {
    return this.root() + '/styles/' + file;
  },

  scripts(file) {
    return this.root() + '/scripts/' + file;
  },
};
