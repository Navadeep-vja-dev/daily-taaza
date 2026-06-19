const AccountPage = {
  async init() {
    if (!CustomerAuth.isLoggedIn()) {
      window.location.href = Paths.pageHref('login.html');
      return;
    }
    const profileEl = document.getElementById('account-profile');
    const addressesEl = document.getElementById('account-addresses');
    document.getElementById('logout-btn').addEventListener('click', () => CustomerAuth.logout());

    try {
      const profile = await CustomerApi.getProfile();
      profileEl.innerHTML =
        '<p><strong>' +
        profile.fullName +
        '</strong></p><p>Phone: ' +
        profile.phone +
        '</p><p>Email: ' +
        (profile.email || '—') +
        '</p>';

      const addresses = await CustomerApi.listAddresses();
      if (!addresses.length) {
        addressesEl.innerHTML = '<p class="body-md">No saved addresses yet. They are saved when you checkout.</p>';
      } else {
        addressesEl.innerHTML = addresses
          .map(
            (a) =>
              '<div class="contact-form-card" style="margin-bottom:12px"><strong>' +
              a.label +
              (a.isDefault ? ' (default)' : '') +
              '</strong><p>' +
              a.addressLine1 +
              ', ' +
              a.city +
              ' ' +
              a.pincode +
              '</p></div>'
          )
          .join('');
      }
    } catch (err) {
      profileEl.innerHTML = '<p class="admin-error">' + err.message + '</p>';
    }
  },
};
