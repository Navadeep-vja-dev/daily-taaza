/**
 * Admin — authentication helpers
 */
const AdminAuth = {
  async login(email, password) {
    const data = await AdminApi.post('/admin/auth/login', { email, password });
    AdminApi.setToken(data.accessToken);
    return data;
  },

  logout() {
    AdminApi.setToken(null);
    window.location.href = 'login.html';
  },

  requireAuth() {
    if (!AdminApi.getToken()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  async getProfile() {
    return AdminApi.get('/admin/auth/me');
  },
};
