# Docker Development Guide

## Prerequisites

1. **Docker Desktop** installed and **running**
2. Node.js 18+ (for running tests from host)

## Quick start

```bash
# From project root
npm install
npm run docker:up
```

This starts:

| Service | Container | Host port |
|---------|-----------|-----------|
| MySQL 8.4 | `daily-taaza-mysql` | 3307 |
| Node app (API + frontend) | `daily-taaza-app` | 3456 |

The app container automatically waits for MySQL, runs `sql/migrate.js`, seeds via `sql/seed.js`, then starts the server with **real MySQL storage** (not in-memory).

## URLs

- Storefront: http://localhost:3456
- Customer login: http://localhost:3456/pages/login.html
- Customer orders: http://localhost:3456/pages/orders.html
- API health: http://localhost:3456/api/health
- Admin login: http://localhost:3456/admin/login.html

**Default admin:** `admin@dailytaaza.com` / `Admin@123`

Register a customer account from the storefront Login page (phone + password).

## Commands

```bash
npm run docker:up      # Build and start containers
npm run docker:down    # Stop containers
npm run docker:logs    # Tail app + mysql logs
npm run docker:seed    # Re-run seed inside container
npm run docker:test    # E2E API tests against Docker stack
npm test               # Fast unit tests (in-memory, no Docker)
```

## Environment

Docker Compose reads `.env` for `DB_PASSWORD`, `DB_USER`, `DB_NAME`, `PORT`.

Inside the app container:

- `DB_HOST=mysql` (Docker network)
- `DB_PORT=3306` (container internal port)

From your host machine (MySQL Workbench, `npm run db:check`):

- `DB_HOST=127.0.0.1`
- `DB_PORT=3307`

## Manual verification checklist

1. Open http://localhost:3456 — products load from MySQL with variant prices
2. Product detail — switch 500g / 1 kg, view image gallery
3. Add to cart → checkout → order confirmed
4. Register/login → My Orders → cancel or reorder
5. Admin login → products (variants), orders with line items
6. `npm run docker:test` passes

## Troubleshooting

**Docker daemon not running**

```
unable to connect to the docker API at npipe://...
```

Start Docker Desktop and retry `npm run docker:up`.

**Port 3456 in use**

```powershell
netstat -ano | findstr :3456
taskkill /PID <pid> /F
```

Or set `PORT=3457` in `.env`.

**MySQL auth errors on host (outside Docker)**

Use `npm run db:init` for local MySQL 9.7, or use Docker (`npm run docker:up`) instead.
