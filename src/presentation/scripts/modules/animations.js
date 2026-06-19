/**
 * Daily Taaza — Animations & scroll UX
 */
const Animations = {
  initPageLoader() {
    const loader = document.querySelector('.page-loader');
    if (!loader) return;

    document.body.classList.add('is-loading');

    window.addEventListener('load', () => {
      document.body.classList.remove('is-loading');
      loader.classList.add('hidden');
      window.setTimeout(() => loader.remove(), 600);
    });

    window.setTimeout(() => {
      if (loader.parentNode) {
        document.body.classList.remove('is-loading');
        loader.classList.add('hidden');
      }
    }, 2500);
  },

  initScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
      bar.setAttribute('aria-valuenow', Math.round(progress));
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  },

  initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    const toggle = () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    };

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },

  initReveal(root = document) {
    const selectors = '.reveal, .fade-in, .section-header--center';
    const elements = root.querySelectorAll(selectors);

    elements.forEach((el) => {
      if (!el.classList.contains('reveal') && !el.classList.contains('fade-in')) {
        el.classList.add('reveal', 'reveal--up');
      }
    });

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.classList.contains('section-header--center')) {
              entry.target.querySelector('.section-label')?.classList.add('revealed');
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );

    root.querySelectorAll(selectors).forEach((el) => {
      if (!el.classList.contains('visible')) observer.observe(el);
    });
  },

  initHeroParallax() {
    const heroVisual = document.querySelector('.hero-visual');
    if (!heroVisual || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          heroVisual.style.transform = 'translateY(' + y * 0.06 + 'px)';
        }
      },
      { passive: true }
    );
  },

  initCounterAnimation() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      if (isNaN(target)) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          observer.disconnect();

          const duration = 1200;
          const start = performance.now();

          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(step);
          };

          requestAnimationFrame(step);
        },
        { threshold: 0.5 }
      );

      observer.observe(el);
    });
  },

  init() {
    this.initPageLoader();
    this.initScrollProgress();
    this.initBackToTop();
    this.initHeroParallax();
    this.initCounterAnimation();
    this.initReveal();
  },
};

function initFadeIn(root) {
  Animations.initReveal(root);
}

function initReveal(root) {
  Animations.initReveal(root);
}
