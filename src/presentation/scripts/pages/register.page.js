const RegisterPage = {
  async init() {
    if (CustomerAuth.isLoggedIn()) {
      window.location.href = Paths.pageHref('account.html');
      return;
    }
    const form = document.getElementById('register-form');
    const errEl = document.getElementById('register-error');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      try {
        const data = await CustomerApi.register({
          fullName: form.fullName.value.trim(),
          phone: form.phone.value.trim(),
          email: form.email.value.trim() || null,
          password: form.password.value,
        });
        CustomerAuth.setToken(data.accessToken);
        window.dispatchEvent(new Event('customerAuthChanged'));
        window.location.href = Paths.pageHref('account.html');
      } catch (err) {
        errEl.textContent = err.message;
      }
    });
  },
};
