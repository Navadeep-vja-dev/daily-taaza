# Daily Taaza — Production Deployment

## Prerequisites

- Node.js 18+
- MySQL 8+
- Nginx (recommended reverse proxy)
- SSL certificate (Let's Encrypt)

## Setup

```bash
cp .env.example .env
# Edit .env with production values

npm install --production
mysql -u root -p < sql/schema.sql
npm run db:seed

npm start
```

## PM2 Process Manager

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Nginx Configuration (example)

```nginx
server {
    listen 80;
    server_name dailytaaza.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dailytaaza.com;

    ssl_certificate /etc/letsencrypt/live/dailytaaza.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dailytaaza.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3456;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        alias /var/www/daily-taaza/uploads/;
    }
}
```

## Environment Variables (Production)

- Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- Configure `DB_*` credentials
- Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- Configure WhatsApp Business API tokens
- Set `CORS_ORIGIN=https://dailytaaza.com`
- Set `NODE_ENV=production`

## Backups

- Daily MySQL dump: `mysqldump daily_taaza > backup.sql`
- Backup `uploads/` directory for product images

## Monitoring

- PM2 logs: `pm2 logs daily-taaza`
- Health check: `GET /api/health`
- Monitor disk space for uploads

## Security Checklist

- [ ] Change default admin password
- [ ] Enable HTTPS only
- [ ] Restrict CORS origin
- [ ] Set rate limits (configured in app)
- [ ] Keep dependencies updated
