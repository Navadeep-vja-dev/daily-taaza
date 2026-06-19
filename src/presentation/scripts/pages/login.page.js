const LoginPage = {
  async init() {
    if (CustomerAuth.isLoggedIn()) {
      window.location.href = Paths.pageHref('account.html');
      return;
    }
    const form = document.getElementById('login-form');
    const errEl = document.getElementById('login-error');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      try {
        const data = await CustomerApi.login(form.phone.value.trim(), form.password.value);
        CustomerAuth.setToken(data.accessToken);
        window.dispatchEvent(new Event('customerAuthChanged'));
        window.location.href = Paths.pageHref('account.html');
      } catch (err) {
        errEl.textContent = err.message;
      }
    });
  },
};
