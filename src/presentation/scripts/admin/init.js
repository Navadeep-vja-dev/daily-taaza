/**
 * Admin — script loader
 */
(function () {
  var script = document.currentScript;
  var src = script.getAttribute('src') || script.src || '';
  var adminBase = src.replace(/init\.js(\?.*)?$/, '');

  var page = document.body.dataset.adminPage || 'dashboard';
  var pageFile = page + '.page.js';

  var files = [
    adminBase + 'admin-api.js',
    adminBase + 'admin-auth.js',
    adminBase + 'admin-layout.js',
    adminBase + pageFile,
  ];

  var index = 0;
  function loadNext() {
    if (index >= files.length) return;
    var s = document.createElement('script');
    s.src = files[index++];
    s.onload = loadNext;
    s.onerror = function () {
      console.error('Failed to load', files[index - 1]);
      loadNext();
    };
    document.head.appendChild(s);
  }
  loadNext();
})();
