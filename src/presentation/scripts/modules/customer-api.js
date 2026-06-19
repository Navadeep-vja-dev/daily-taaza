/**
 * Customer API client
 */
const CustomerApi = {
  async request(method, path, body) {
    const headers = CustomerAuth.authHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch((DataSourceConfig.apiBaseUrl || '/api') + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (res.status === 401) {
      CustomerAuth.setToken(null);
      window.location.href = Paths.pageHref('login.html');
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(json.error?.message || 'Request failed');
    return json.data;
  },

  register(payload) {
    return this.request('POST', '/auth/register', payload);
  },

  login(phone, password) {
    return this.request('POST', '/auth/login', { phone, password });
  },

  getProfile() {
    return this.request('GET', '/auth/me');
  },

  updateProfile(payload) {
    return this.request('PUT', '/auth/me', payload);
  },

  listOrders() {
    return this.request('GET', '/customers/me/orders');
  },

  getOrder(orderNumber) {
    return this.request('GET', '/customers/me/orders/' + encodeURIComponent(orderNumber));
  },

  cancelOrder(orderNumber) {
    return this.request('POST', '/customers/me/orders/' + encodeURIComponent(orderNumber) + '/cancel');
  },

  async reorder(orderNumber) {
    const headers = CustomerAuth.authHeaders({ 'Content-Type': 'application/json' });
    const cartToken = localStorage.getItem('dailyTaazaCartToken');
    if (cartToken) headers['X-Cart-Token'] = cartToken;
    const res = await fetch(
      (DataSourceConfig.apiBaseUrl || '/api') + '/customers/me/orders/' + encodeURIComponent(orderNumber) + '/reorder',
      { method: 'POST', headers }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Reorder failed');
    const token = res.headers.get('X-Cart-Token') || json.data?.cartToken;
    if (token) localStorage.setItem('dailyTaazaCartToken', token);
    return json.data;
  },

  listAddresses() {
    return this.request('GET', '/customers/me/addresses');
  },

  createAddress(payload) {
    return this.request('POST', '/customers/me/addresses', payload);
  },

  deleteAddress(id) {
    return this.request('DELETE', '/customers/me/addresses/' + id);
  },
};
