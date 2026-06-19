/**
 * Daily Taaza — Theme toggle (light / dark)
 */
const Theme = {
  get() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  set(theme) {
    document.documentElement.classList.add('theme-transitioning');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(SiteConfig.themeKey, theme);
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 350);
  },

  init() {
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-label', this.get() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.addEventListener('click', () => {
        this.set(this.get() === 'dark' ? 'light' : 'dark');
      });
    });
  },
};
