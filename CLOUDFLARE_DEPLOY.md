# Hotel Haven — Cloudflare Deployment

## One-time setup

### 1. Create the D1 database

```bash
npx wrangler d1 create hotel-haven-db
```

Copy the `database_id` output and add it to `cloudflare/wrangler.toml`.

### 2. Run the schema migration

```bash
npx wrangler d1 migrations apply hotel-haven-db
```

### 3. Set the Resend API key (for email sending)

Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day).
Then:

```bash
npx wrangler secret put RESEND_API_KEY
```

### 4. Connect the repo to Cloudflare Pages

1. Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. Click **Create a project** → **Connect to Git**
3. Select the `hotel-haven` repo
4. Build settings: **Framework preset = None**, **Build command = empty**
5. **Build output directory = /** (root)
6. Click **Deploy**

### 5. Attach D1 to the Pages project

In the Pages project → **Settings → Functions → D1 database bindings**:
- Variable name: `DB`
- D1 database: `hotel-haven-db`

### 6. Set environment variables in Pages

Pages project → **Settings → Environment variables**:
- `RESEND_API_KEY` = your Resend API key
- `RESEND_FROM` = `Hotel Haven <haven@yourdomain.com>`
- `SITE_URL` = `https://yourdomain.com`

### 7. Point your domain

In the Pages project → **Custom domains** → add your domain.
Cloudflare handles DNS automatically.

## File structure

```
hotel-haven/
├── index.html            ← static frontend (served by Pages)
├── rooms.html
├── about.html
├── contact.html
├── facilities.html
├── styles.css
├── script.js             ← frontend JS (uses relative /api/* URLs)
├── admin.css
├── island-guide-2026.pdf ← downloadable guide
├── functions/            ← Cloudflare Pages Functions (API backend)
│   ├── _routes.json
│   └── api/
│       ├── [[path]].js   ← all API endpoints
│       └── _admin.js     ← admin dashboard renderer
├── cloudflare/           ← reference config
│   ├── wrangler.toml
│   ├── package.json
│   └── migrations/
│       └── 0001_schema.sql
└── booking/              ← original FastAPI backend (kept for local dev)
```

## Local development

```bash
# Start Pages dev server with D1 + secrets
npx wrangler pages dev --d1 DB --binding RESEND_API_KEY=test
```
