/**
 * Data layer — API cart provider
 */
const ApiCartProvider = {
  _token: localStorage.getItem('dailyTaazaCartToken') || null,

  getToken() {
    return this._token;
  },

  setToken(token) {
    this._token = token;
    if (token) localStorage.setItem('dailyTaazaCartToken', token);
    else localStorage.removeItem('dailyTaazaCartToken');
  },

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this._token) h['X-Cart-Token'] = this._token;
    if (typeof CustomerAuth !== 'undefined' && CustomerAuth.getToken()) {
      h.Authorization = 'Bearer ' + CustomerAuth.getToken();
    }
    return h;
  },

  async _request(method, path, body) {
    const base = DataSourceConfig.apiBaseUrl || '/api';
    const res = await fetch(base + path, {
      method,
      headers: this._headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Cart request failed');
    const token = res.headers.get('X-Cart-Token');
    if (token) this.setToken(token);
    if (json.data?.cartToken) this.setToken(json.data.cartToken);
    return json.data;
  },

  async getItems() {
    const data = await this._request('GET', '/cart');
    return data.items || [];
  },

  async addItem(productId, quantity, variantId) {
    const payload = { productId, quantity };
    if (variantId) payload.variantId = variantId;
    const data = await this._request('POST', '/cart/items', payload);
    return data.items || [];
  },

  async updateItem(variantId, quantity) {
    const data = await this._request('PATCH', '/cart/items/' + encodeURIComponent(variantId), {
      quantity,
    });
    return data.items || [];
  },

  async removeItem(variantId) {
    const data = await this._request('DELETE', '/cart/items/' + encodeURIComponent(variantId));
    return data.items || [];
  },

  async clear() {
    const data = await this._request('DELETE', '/cart');
    return data.items || [];
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiCartProvider;
}
