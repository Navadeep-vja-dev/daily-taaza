/**
 * Daily Taaza — API integration tests (in-memory storage)
 */
process.env.NODE_ENV = 'test';
process.env.DB_USE_MEMORY = 'true';
process.env.PORT = '3457';

const http = require('http');
const db = require('../src/data/mysql/db');
const app = require('../app');

const PORT = parseInt(process.env.PORT, 10) || 3457;
let server;

function closeServer(s) {
  return new Promise((resolve, reject) => {
    if (!s) return resolve();
    s.close((err) => (err ? reject(err) : resolve()));
  });
}

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
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
  let customerToken;
  let adminToken;
  let orderNumber;
  const testPhone = '9123456789';

  function assert(name, cond) {
    if (cond) {
      console.log('  OK', name);
      passed++;
    } else {
      console.log('  FAIL', name);
      failed++;
    }
  }

  try {
    await db.connect();
    server = app.listen(PORT);
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });

    console.log('Running API tests (in-memory mode)...\n');

    let r = await request('GET', '/api/health');
    assert('health', r.status === 200 && r.body.success);

    r = await request('GET', '/api/products');
    assert('products list', r.status === 200 && r.body.data.length === 27);
    const firstProduct = r.body.data[0];
    const firstProductId = firstProduct.id;
    assert('product id is P- format', /^P-\d{6}$/.test(firstProductId));
    const defaultVariant = firstProduct.variants?.find((v) => v.isDefault) || firstProduct.variants?.[0];

    r = await request('GET', '/api/products/' + firstProductId);
    assert('product detail', r.status === 200 && r.body.data.variants?.length >= 2);
    assert('product images', r.body.data.images?.length >= 1);

    r = await request('GET', '/api/categories');
    assert('categories', r.status === 200 && r.body.data.length >= 4);
    assert('category id is numeric', typeof r.body.data[0].id === 'number');
    assert('category has no sortOrder', r.body.data[0].sortOrder === undefined);
    const firstCategoryId = r.body.data[0].id;

    r = await request('GET', '/api/cart');
    cartToken = r.headers['x-cart-token'];
    assert('cart get', r.status === 200 && cartToken);

    r = await request(
      'POST',
      '/api/cart/items',
      { productId: firstProductId, variantId: defaultVariant?.id, quantity: 1 },
      { 'X-Cart-Token': cartToken }
    );
    cartToken = r.headers['x-cart-token'] || cartToken;
    assert('cart add with variant', r.status === 201 && r.body.data.items.length === 1);

    const variantId = r.body.data.items[0].variantId;
    r = await request('PATCH', '/api/cart/items/' + variantId, { quantity: 2 }, { 'X-Cart-Token': cartToken });
    assert('cart update', r.status === 200 && r.body.data.items[0].quantity === 2);

    r = await request('POST', '/api/auth/register', {
      phone: testPhone,
      password: 'Test@1234',
      fullName: 'Test Customer',
      email: 'customer@test.com',
    });
    customerToken = r.body?.data?.accessToken;
    assert('customer register', r.status === 201 && customerToken);

    r = await request('GET', '/api/auth/me', null, { Authorization: 'Bearer ' + customerToken });
    assert('customer profile', r.status === 200 && r.body.data.phone === testPhone);

    r = await request(
      'POST',
      '/api/orders',
      {
        fullName: 'Test Customer',
        phone: testPhone,
        addressLine1: '123 Test Street',
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

    r = await request(
      'GET',
      '/api/customers/me/orders/' + orderNumber,
      null,
      { Authorization: 'Bearer ' + customerToken }
    );
    assert('customer order detail', r.status === 200 && r.body.data.orderNumber === orderNumber);

    r = await request(
      'POST',
      '/api/customers/me/orders/' + orderNumber + '/cancel',
      null,
      { Authorization: 'Bearer ' + customerToken }
    );
    assert('customer cancel order', r.status === 200 && r.body.data.status === 'cancelled');

    r = await request('POST', '/api/contact', {
      name: 'Test User',
      email: 'test@example.com',
      message: 'Hello from tests',
    });
    assert('contact', r.status === 201);

    r = await request('POST', '/api/admin/auth/login', {
      email: 'admin@dailytaaza.com',
      password: 'Admin@123',
    });
    adminToken = r.body?.data?.accessToken;
    assert('admin login', r.status === 200 && adminToken);

    const auth = { Authorization: 'Bearer ' + adminToken };
    r = await request('GET', '/api/admin/auth/me', null, auth);
    assert('admin me', r.status === 200);

    r = await request('GET', '/api/settings/public');
    assert('public settings', r.status === 200);

    const disposableId = 'P-009999';
    r = await request(
      'POST',
      '/api/admin/products',
      {
        id: disposableId,
        category_id: firstCategoryId,
        name: 'Disposable Test Product',
        slug: 'disposable-test-product',
        price: 50,
        description: 'Temporary product for delete test',
        ingredients: ['test'],
        benefits: ['test'],
        placeholder_color: '#E8F5E9',
        stock_qty: 5,
        variants: [
          {
            id: disposableId + '-500g',
            label: '500g',
            price: 50,
            stock_qty: 5,
            is_default: true,
            sort_order: 0,
          },
        ],
      },
      auth
    );
    assert('admin create disposable product', r.status === 201);

    const disposableCart = await request('GET', '/api/cart');
    const disposableCartToken = disposableCart.headers['x-cart-token'];
    r = await request(
      'POST',
      '/api/cart/items',
      { productId: disposableId, variantId: disposableId + '-500g', quantity: 1 },
      { 'X-Cart-Token': disposableCartToken }
    );
    assert('cart add disposable product', r.status === 201);

    r = await request(
      'POST',
      '/api/orders',
      {
        fullName: 'Test Customer',
        phone: testPhone,
        addressLine1: '123 Test Street',
        city: 'Hyderabad',
        pincode: '500001',
        paymentMethod: 'cod',
      },
      { 'X-Cart-Token': r.headers['x-cart-token'] || disposableCartToken, Authorization: 'Bearer ' + customerToken }
    );
    const disposableOrderNumber = r.body?.data?.order?.orderNumber;
    assert('order with disposable product', r.status === 201 && disposableOrderNumber);

    r = await request('DELETE', '/api/admin/products/' + disposableId, null, auth);
    assert('admin hard delete product', r.status === 200);

    r = await request('GET', '/api/products/' + disposableId);
    assert('deleted product not found', r.status === 404);

    r = await request(
      'GET',
      '/api/customers/me/orders/' + disposableOrderNumber,
      null,
      { Authorization: 'Bearer ' + customerToken }
    );
    assert(
      'order history keeps deleted product snapshot',
      r.status === 200 &&
        r.body.data.items.length === 1 &&
        r.body.data.items[0].name === 'Disposable Test Product'
    );

    const productDetail = await request('GET', '/api/products/' + firstProductId);
    const cartForUpdate = await request('GET', '/api/cart');
    const cartTokenForUpdate = cartForUpdate.headers['x-cart-token'];
    const variantForUpdate = productDetail.body.data.variants[0];
    await request(
      'POST',
      '/api/cart/items',
      { productId: firstProductId, variantId: variantForUpdate.id, quantity: 1 },
      { 'X-Cart-Token': cartTokenForUpdate }
    );

    r = await request(
      'PUT',
      '/api/admin/products/' + firstProductId,
      {
        name: productDetail.body.data.name,
        description: productDetail.body.data.description,
        variants: productDetail.body.data.variants.map((v, i) => ({
          id: v.id,
          label: v.label,
          price: v.price,
          stock_qty: v.stockQty,
          is_default: v.isDefault,
          sort_order: i,
        })),
      },
      auth
    );
    assert('admin update product with cart variant', r.status === 200);

    console.log('\n' + passed + ' passed, ' + failed + ' failed');
    process.exit(failed ? 1 : 0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await closeServer(server);
    await db.disconnect();
  }
}

run();
