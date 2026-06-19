# Daily Taaza — Backend Architecture

## Layers

```
src/
├── api/           HTTP routes, controllers, middleware, validators
├── data/          MySQL repos, mock data, external providers (Razorpay, WhatsApp)
├── domain/        Business logic (client + server services)
├── shared/        Config, errors, logger, utilities
└── presentation/  Frontend views, styles, scripts (storefront + admin)
```

## Run (recommended — Docker)

```bash
cp .env.example .env
npm install
npm run docker:up    # MySQL + Node app containers
npm run docker:test  # E2E against real MySQL
```

See [deploy/DOCKER.md](deploy/DOCKER.md) for full Docker workflow.

## Run (local without Docker)

```bash
npm run db:init      # First time: provisions MySQL user + seeds
npm start
npm test             # In-memory tests only (DB_USE_MEMORY=true)
```

## URLs

- Storefront: http://localhost:3456
- Customer login: http://localhost:3456/pages/login.html
- Customer account: http://localhost:3456/pages/account.html
- Admin: http://localhost:3456/admin/login.html
- API: http://localhost:3456/api

## API Base URL

`http://localhost:3456/api`

## Key Endpoints

| Area | Routes |
|------|--------|
| Products | GET /api/products, GET /api/products/:id (includes `variants[]`, `images[]`) |
| Categories | GET /api/categories |
| Cart | GET/POST/PATCH/DELETE /api/cart/* (cart keyed by `variantId`) |
| Customer auth | POST /api/auth/register, /login; GET/PUT /api/auth/me |
| Customer orders | GET /api/customers/me/orders, cancel, reorder |
| Orders | POST /api/orders, GET /api/orders/:orderNumber (auth or phoneLast4) |
| Contact | POST /api/contact, POST /api/newsletter |
| Payments | POST /api/payments/create-order, /verify, /webhook (Razorpay stub without keys) |
| Admin | POST /api/admin/auth/login, CRUD under /api/admin/* |

## Default Admin (seed)

- Email: `admin@dailytaaza.com`
- Password: `Admin@123` (change in production)

## Database modes

| Mode | When |
|------|------|
| **MySQL** | Docker (`npm run docker:up`) or local MySQL configured in `.env` |
| **In-memory** | Only when `DB_USE_MEMORY=true` (used by `npm test`) |

The storefront uses API data (`products: 'api'`, `cart: 'api'` in `dataSource.config.js`). In-memory mode is for tests, not production.

## Admin dashboard

Full admin UI at `/admin/` — products (with variants + multi-image), categories, orders, contact messages.

## Customer accounts

Phone + password registration. Customers can view order history, cancel pending/confirmed orders, and reorder items to cart.

## Product variants & images

Each product has weight variants (e.g. 500g, 1 kg) with separate prices/stock. Product images are stored in `product_images`; PDP shows real gallery thumbnails.

## Deployment

- Docker dev: [deploy/DOCKER.md](deploy/DOCKER.md)
- Production: [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md)
