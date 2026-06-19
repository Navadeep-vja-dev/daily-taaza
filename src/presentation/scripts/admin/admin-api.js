/**
 * Admin — API client with JWT auth
 */
const AdminApi = {
  baseUrl: '/api',

  getToken() {
    return sessionStorage.getItem('adminAccessToken');
  },

  setToken(token) {
    if (token) sessionStorage.setItem('adminAccessToken', token);
    else sessionStorage.removeItem('adminAccessToken');
  },

  async request(method, path, body, isFormData = false) {
    const headers = {};
    const token = this.getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const opts = { method, headers };
    if (body) {
      if (isFormData) {
        opts.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }

    const res = await fetch(this.baseUrl + path, opts);
    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (res.status === 401) {
      this.setToken(null);
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
      }
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(json?.error?.message || json?.message || 'Request failed');
    }

    return json.data !== undefined ? json.data : json;
  },

  get(path) {
    return this.request('GET', path);
  },

  post(path, body) {
    return this.request('POST', path, body);
  },

  put(path, body) {
    return this.request('PUT', path, body);
  },

  delete(path) {
    return this.request('DELETE', path);
  },

  uploadImage(file, productId) {
    const fd = new FormData();
    fd.append('image', file);
    if (productId) fd.append('productId', productId);
    return this.request('POST', '/admin/uploads/products', fd, true);
  },
};
