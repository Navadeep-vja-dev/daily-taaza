const AdminLoginPage = {
  init() {
    if (AdminApi.getToken()) {
      window.location.href = 'index.html';
      return;
    }

    const form = document.getElementById('admin-login-form');
    const errorEl = document.getElementById('admin-login-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';
      try {
        await AdminAuth.login(form.email.value.trim(), form.password.value);
        window.location.href = 'index.html';
      } catch (err) {
        errorEl.textContent = err.message || 'Login failed';
      }
    });
  },
};

AdminLoginPage.init();
