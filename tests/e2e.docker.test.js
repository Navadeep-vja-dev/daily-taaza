/**
 * E2E tests against Docker stack (MySQL + app on :3456)
 * Prerequisite: npm run docker:up
 */
const http = require('http');

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3456';
const url = new URL(BASE);

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            json = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  let passed = 0;
  let failed = 0;
  let cartToken;
  let adminToken;
  let customerToken;
  let orderNumber;
  const testPhone = '9988776655';
  const testProductId = 'e2e-test-product-' + Date.now();

  function assert(name, cond) {
    if (cond) {
      console.log('  OK', name);
      passed++;
    } else {
      console.log('  FAIL', name);
      failed++;
    }
  }

  console.log('E2E Docker tests against', BASE, '\n');

  let r = await request('GET', '/api/health');
  assert('health', r.status === 200 && r.body.success);

  r = await request('GET', '/api/settings/public');
  assert('public settings', r.status === 200);

  r = await request('GET', '/api/products');
  assert('products from mysql', r.status === 200 && r.body.data.length >= 1);
  const sampleProduct = r.body.data[0];
  const defaultVariant = sampleProduct.variants?.find((v) => v.isDefault) || sampleProduct.variants?.[0];

  r = await request('GET', '/api/products/' + sampleProduct.id);
  assert('product detail variants', r.status === 200 && r.body.data.variants?.length >= 2);
  assert('product detail images', r.status === 200 && r.body.data.images?.length >= 1);

  r = await request('GET', '/api/products/' + sampleProduct.id + '/related');
  assert('product related', r.status === 200);

  r = await request('GET', '/api/categories');
  assert('categories', r.status === 200 && r.body.data.length >= 1);
  const categoryId = r.body.data[0]?.id || 'batters';

  r = await request('GET', '/api/cart');
  cartToken = r.headers['x-cart-token'];
  assert('cart session', r.status === 200 && cartToken);

  r = await request(
    'POST',
    '/api/cart/items',
    {
      productId: sampleProduct.id,
      variantId: defaultVariant?.id,
      quantity: 1,
    },
    { 'X-Cart-Token': cartToken }
  );
  cartToken = r.headers['x-cart-token'] || cartToken;
  const cartVariantId = r.body?.data?.items?.[0]?.variantId;
  assert('cart add variant', r.status === 201);

  if (cartVariantId) {
    r = await request(
      'PATCH',
      '/api/cart/items/' + cartVariantId,
      { quantity: 2 },
      { 'X-Cart-Token': cartToken }
    );
    assert('cart update', r.status === 200);
  }

  r = await request('POST', '/api/auth/register', {
    phone: testPhone,
    password: 'E2E@1234',
    fullName: 'E2E Customer',
    email: 'e2e-customer@test.com',
  });
  customerToken = r.body?.data?.accessToken;
  assert('customer register', r.status === 201 && customerToken);

  r = await request('GET', '/api/auth/me', null, { Authorization: 'Bearer ' + customerToken });
  assert('customer profile', r.status === 200);

  r = await request('POST', '/api/contact', {
    name: 'E2E User',
    email: 'e2e@test.com',
    message: 'Docker E2E test message',
  });
  assert('contact', r.status === 201);

  r = await request('POST', '/api/newsletter', { email: 'e2e-news@test.com' });
  assert('newsletter', r.status === 201);

  r = await request(
    'POST',
    '/api/orders',
    {
      fullName: 'E2E Customer',
      phone: testPhone,
      addressLine1: '123 Docker Street',
      city: 'Hyderabad',
      pincode: '500001',
      paymentMethod: 'cod',
    },
    { 'X-Cart-Token': cartToken, Authorization: 'Bearer ' + customerToken }
  );
  orderNumber = r.body?.data?.order?.orderNumber;
  assert('order create', r.status === 201 && orderNumber);

  r = await request('GET', '/api/customers/me/orders', null, { Authorization: 'Bearer ' + customerToken });
  assert('customer orders', r.status === 200 && r.body.data.length >= 1);

  if (orderNumber) {
    r = await request('GET', '/api/orders/' + orderNumber, null, {
      Authorization: 'Bearer ' + customerToken,
    });
    assert('order get authenticated', r.status === 200);

    r = await request(
      'POST',
      '/api/customers/me/orders/' + orderNumber + '/cancel',
      null,
      { Authorization: 'Bearer ' + customerToken }
    );
    assert('customer cancel', r.status === 200 && r.body.data.status === 'cancelled');

    r = await request(
      'POST',
      '/api/customers/me/orders/' + orderNumber + '/reorder',
      null,
      { Authorization: 'Bearer ' + customerToken, 'X-Cart-Token': cartToken }
    );
    cartToken = r.headers['x-cart-token'] || cartToken;
    assert('customer reorder', r.status === 200 && r.body.data.items?.length >= 1);
  }

  r = await request('POST', '/api/admin/auth/login', {
    email: 'admin@dailytaaza.com',
    password: 'Admin@123',
  });
  adminToken = r.body?.data?.accessToken;
  assert('admin login', r.status === 200 && adminToken);

  const auth = { Authorization: 'Bearer ' + adminToken };
  r = await request('GET', '/api/admin/auth/me', null, auth);
  assert('admin me', r.status === 200);

  r = await request('GET', '/api/admin/orders', null, auth);
  assert('admin orders with items', r.status === 200 && r.body.data[0]?.items?.length >= 0);

  r = await request('GET', '/api/admin/products', null, auth);
  assert('admin products', r.status === 200);

  r = await request(
    'POST',
    '/api/admin/products',
    {
      id: testProductId,
      category_id: categoryId,
      name: 'E2E Test Product',
      slug: testProductId,
      price: 99,
      badge: 'Test',
      description: 'E2E test product',
      ingredients: ['test'],
      benefits: ['test'],
      image: 'assets/images/idli-dosa-batter.jpg',
      placeholder_color: '#E8F5E9',
      stock_qty: 10,
      variants: [
        { id: testProductId + '-500g', label: '500g', price: 99, stock_qty: 10, is_default: true, sort_order: 0 },
        { id: testProductId + '-1kg', label: '1 kg', price: 179, stock_qty: 10, is_default: false, sort_order: 1 },
      ],
    },
    auth
  );
  assert('admin create product with variants', r.status === 201);

  r = await request(
    'PUT',
    '/api/admin/products/' + testProductId,
    { name: 'E2E Test Product Updated', price: 109 },
    auth
  );
  assert('admin update product', r.status === 200);

  r = await request('DELETE', '/api/admin/products/' + testProductId, null, auth);
  assert('admin delete product', r.status === 200);

  r = await request('GET', '/api/admin/contact-messages', null, auth);
  assert('admin messages', r.status === 200);

  r = await request('GET', '/admin/login.html');
  assert('admin login page', r.status === 200);

  r = await request('GET', '/pages/login.html');
  assert('customer login page', r.status === 200);

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error('E2E failed:', err.message);
  console.error('Is Docker running? Try: npm run docker:up');
  process.exit(1);
});
