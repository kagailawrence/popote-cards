# Development Specification: Success Card Delivery Platform




---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Node.js + TypeScript + Express (or Fastify) |
| Database | PostgreSQL — accessed via **raw parameterized SQL only, no ORM** (`pg` driver, `node-pg-migrate` or plain `.sql` files for migrations — migrations are not an ORM, just version-controlled schema changes) |
| Auth | JWT (access + refresh tokens), bcrypt for password hashing |
| Cache/Queue | Redis (caching + BullMQ for background jobs) |
| Payments | M-Pesa Daraja API (STK Push) |
| File storage | **Local filesystem on the server** (`/server/storage`), organized by resource type, kept outside any web-servable path and served only through an authenticated/controlled route — not raw static file serving |

**Hard constraint carried through this entire document: no ORM anywhere in the backend.** All queries are raw SQL via the `pg` library's parameterized query syntax (`$1, $2...`), wrapped in a thin repository/data-access layer per resource so raw SQL stays organized and testable, not scattered through route handlers.

**One honest trade-off worth naming up front:** storing files on the server's local disk (instead of object storage) is simpler to build and keeps everything in one place, but it ties uploads to that one server — if you ever need to run multiple app servers behind a load balancer for scale, local storage needs a shared network volume or a move to object storage at that point. For the scale this project is launching at, local storage is a reasonable choice as long as the backup strategy in Section 9 is taken seriously, since — unlike object storage — a single disk failure with no backup means the files are just gone.

---

## 2. Repository Structure

```
/frontend                  # Next.js app (TypeScript, Tailwind)
  /app                      # App Router pages
  /components
  /lib                      # API client, utilities
  /hooks
  /store                    # Client-side state (cart, etc.)
  /public
  next.config.js
  tailwind.config.ts
  package.json

/server                    # Node.js API (TypeScript, raw SQL)
  /src
    /config                 # env, db pool, redis client
    /db
      /migrations           # versioned raw .sql migration files
      /queries               # raw SQL per resource (repositories)
    /modules
      /auth
      /catalog               # designs, categories, templates
      /pricing
      /locations              # counties, sub-counties, CBD/outskirts
      /orders
      /cart
      /payments               # M-Pesa Daraja integration
      /printing                # regional routing
      /riders                  # delivery + proof of delivery
      /disputes
      /notifications           # SMS/email
      /files                   # upload handling, streaming, validation
      /admin
    /middleware              # auth, rate-limit, error handling, validation
    /jobs                    # BullMQ background workers (incl. scheduled backups)
    /utils
    app.ts
    server.ts
  /storage                  # uploaded files — NOT web-servable directly, gitignored
    /design-images
    /customer-photos
    /delivery-notes
    /tmp                     # transient upload staging, swept automatically
  /backups                  # local staging area before off-server sync (gitignored)
  package.json
  tsconfig.json
```

---

## 3. Database Design

### 3.1 Principles

- Every table has a UUID primary key (`gen_random_uuid()` via the `pgcrypto` extension), **not auto-increment integers** — avoids exposing sequential IDs in URLs (`/orders/242`) and is standard API-security practice.
- Every foreign key column is indexed.
- Every column used in a `WHERE`, `JOIN`, or `ORDER BY` in a known query path is indexed.
- Composite indexes for common filter combinations (e.g., catalog filtering by occasion + style + religion together).
- Timestamps (`created_at`, `updated_at`) on every table.
- `SELECT *` is never used in application code — every query names its columns explicitly.
- Columns that reference an uploaded file (`design_images.image_url`, `order_items.custom_photo_url`, `deliveries.delivery_note_scan_url`) store a **relative path within `/server/storage`** (e.g., `customer-photos/8f3c...jpg`), not a full URL — the file-serving route resolves that path server-side, which keeps the actual disk layout out of the database and out of any response payload.

### 3.2 Core Tables (indicative — not exhaustive)

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- 'admin' | 'super_admin' | 'rider_manager'
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admins_email ON admins(email);

CREATE TABLE counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE sub_counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id UUID NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('cbd', 'outskirts'))
);
CREATE INDEX idx_subcounties_county_id ON sub_counties(county_id);

CREATE TABLE print_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE -- Central, Coast, Eastern, Nairobi, North Eastern, Nyanza, Rift Valley, Western
);

CREATE TABLE county_print_regions (
  county_id UUID NOT NULL REFERENCES counties(id) ON DELETE CASCADE,
  print_region_id UUID NOT NULL REFERENCES print_regions(id) ON DELETE CASCADE,
  PRIMARY KEY (county_id, print_region_id)
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('occasion', 'style', 'religion')),
  name TEXT NOT NULL,
  UNIQUE (type, name)
);

CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allows_custom_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE design_images ( -- powers the 360° viewer: multiple angles per design
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- relative path in /server/storage/design-images
  angle_order SMALLINT NOT NULL
);
CREATE INDEX idx_design_images_design_id ON design_images(design_id);

CREATE TABLE design_categories (
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (design_id, category_id)
);
CREATE INDEX idx_design_categories_category_id ON design_categories(category_id);

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_category_id UUID REFERENCES categories(id),
  body TEXT NOT NULL
);
CREATE INDEX idx_message_templates_occasion ON message_templates(occasion_category_id);

CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size TEXT NOT NULL CHECK (size IN ('A3', 'A4', 'A5')),
  is_custom_photo BOOLEAN NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('cbd', 'outskirts')),
  amount_kes NUMERIC(10,2) NOT NULL,
  UNIQUE (size, is_custom_photo, zone)
);

CREATE TABLE customers ( -- lightweight, no login required — identified by phone at checkout
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_phone ON customers(phone);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE, -- short human-readable code, separate from the UUID
  customer_id UUID NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending_payment',
    -- pending_payment | paid | routed_to_print | printing | dispatched | delivered | disputed | cancelled
  total_amount_kes NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE TABLE order_items ( -- one per card in the cart
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  design_id UUID NOT NULL REFERENCES designs(id),
  size TEXT NOT NULL CHECK (size IN ('A3', 'A4', 'A5')),
  custom_photo_storage_path TEXT, -- relative path in /server/storage/customer-photos
  message_body TEXT NOT NULL,
  message_font TEXT,
  message_colour TEXT,
  recipient_full_names TEXT NOT NULL,
  admission_number TEXT NOT NULL,
  school_name TEXT NOT NULL,
  county_id UUID NOT NULL REFERENCES counties(id),
  sub_county_id UUID NOT NULL REFERENCES sub_counties(id),
  po_box TEXT,
  class_form TEXT,
  unit_price_kes NUMERIC(10,2) NOT NULL,
  print_region_id UUID REFERENCES print_regions(id),
  print_status TEXT NOT NULL DEFAULT 'queued', -- queued | printing | ready
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_print_region_id ON order_items(print_region_id);
CREATE INDEX idx_order_items_print_status ON order_items(print_status);

CREATE TABLE mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  checkout_request_id TEXT NOT NULL UNIQUE, -- from STK push, used to prevent duplicate callback processing
  mpesa_receipt_number TEXT UNIQUE,
  phone TEXT NOT NULL,
  amount_kes NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | success | failed | cancelled
  raw_callback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mpesa_order_id ON mpesa_transactions(order_id);
CREATE UNIQUE INDEX idx_mpesa_checkout_request_id ON mpesa_transactions(checkout_request_id);

CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  rider_id UUID REFERENCES riders(id),
  delivery_note_storage_path TEXT, -- relative path in /server/storage/delivery-notes
  delivered_at TIMESTAMPTZ,
  rider_payment_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid | paid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliveries_order_item_id ON deliveries(order_item_id);
CREATE INDEX idx_deliveries_rider_id ON deliveries(rider_id);
CREATE INDEX idx_deliveries_rider_payment_status ON deliveries(rider_payment_status);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  mpesa_transaction_code TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('call', 'website')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | in_review | resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_disputes_order_id ON disputes(order_id);
CREATE INDEX idx_disputes_status ON disputes(status);

CREATE TABLE refresh_tokens ( -- for JWT refresh flow, supports revocation
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_admin_id ON refresh_tokens(admin_id);
```

This is a starting schema — expect to refine it once pricing/zone rules and rider workflow are fully confirmed (see the open questions in the SOW).

---

## 4. Backend Implementation Rules

### 4.1 Data Access Layer (raw SQL, no ORM)

- Use the `pg` package with a shared `Pool`, tuned connection pool settings (`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`) set from environment variables — not left as library defaults.
- Every query is parameterized (`$1, $2…`) — string concatenation into SQL is never permitted, full stop, since that's the #1 SQL-injection vector.
- Each module owns its own `queries.ts` file with named, typed functions (e.g., `getOrderById(id: string): Promise<Order | null>`), so raw SQL is centralized and reviewable, not duplicated across route handlers.
- Migrations live as plain versioned `.sql` files (or via `node-pg-migrate`, which just runs SQL — not an ORM), applied in CI/CD before deploy, never run ad hoc against production.
- Multi-step writes (e.g., creating an order + its items + decrementing any relevant counters) run inside explicit `BEGIN/COMMIT/ROLLBACK` transactions.

### 4.2 Authentication (JWT)

- Access tokens: short-lived (15 minutes), signed with a strong secret (256-bit minimum) or RS256 key pair.
- Refresh tokens: longer-lived (7 days), stored hashed in the `refresh_tokens` table so they can be revoked; rotated on every use.
- JWT payload kept minimal — admin `id` and `role` only, never passwords or sensitive data.
- Algorithm is fixed server-side (`HS256` or `RS256`) — the app never trusts an `alg` field from the incoming token header, which is a classic JWT bypass vector.
- Passwords hashed with bcrypt (cost factor 12+).
- Login endpoint has max-retry lockout: after N failed attempts, the account is temporarily locked (`locked_until` column already in the schema above).
- Every admin route is behind auth middleware by default — no route is unprotected unless explicitly and deliberately marked public (health checks, the M-Pesa callback with its own signature validation, etc.).
- Customers don't need accounts/passwords for v1 — order lookup is by order number + phone, not a login system, per the SOW.

### 4.3 API Security Checklist → Implementation

- `helmet` middleware for response headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`, and to strip `X-Powered-By`.
- HTTPS enforced at the load balancer/reverse proxy level; HSTS header sent.
- CORS locked to the known frontend origin(s) only.
- Rate limiting (`express-rate-limit` + Redis store) on: login, STK push initiation, dispute submission, file uploads, and generally all public POST endpoints.
- All UUID-based resource IDs in URLs (already enforced by the schema design above) — no incrementing integer IDs exposed.
- Response codes used correctly (`400` validation, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict, `429` rate-limited, `500` server error) — not everything collapsed into `200`/`500`.
- Sensitive data (tokens, password hashes, raw M-Pesa callback payloads) never returned in API responses, even to admins, except where explicitly needed for a debugging view behind a stricter role.
- `NODE_ENV=production` disables any debug/stack-trace leakage in error responses.

### 4.4 File Storage — Security & Memory Management

Since files live on the server's own disk rather than object storage, this area needs deliberate handling rather than relying on a managed service's defaults:

- **Location:** all uploads live under `/server/storage`, organized by type (`design-images`, `customer-photos`, `delivery-notes`), and this directory is **never** inside `/public` or any path Express serves statically. Files are only reachable through an authenticated controller route that checks permissions first (e.g., a customer can only fetch the photo attached to their own order via order number + phone; delivery-note scans are admin/rider-only).
- **Filenames:** never trust a client-supplied filename. Generate a new UUID-based filename server-side on write, and store the original filename only as metadata if it's needed for display. This closes off path-traversal attacks (`../../etc/passwd`-style) and prevents one upload silently overwriting another.
- **Type validation:** validate both the file extension and the actual file content (magic-byte sniffing via a package like `file-type`) — trusting the extension or the client-sent `Content-Type` alone is trivially spoofed.
- **Size limits:** enforced server-side at the upload-middleware level, not just in the frontend form (e.g., 5MB for customer photos, 10MB for delivery-note scans) — client-side limits are a UX nicety, not a security control.
- **Memory management:** uploads are streamed straight to disk using `multer`'s `diskStorage` engine, never `memoryStorage`. Buffering whole files in RAM works fine in testing and then falls over under concurrent real uploads — it's one of the more common ways a Node process gets OOM-killed under load, so this is a real, not theoretical, concern for a public photo-upload endpoint.
- **Temp file cleanup:** a `/server/storage/tmp` staging directory holds in-progress/chunked uploads, swept by a scheduled job that removes anything abandoned for more than a few hours, so failed uploads don't slowly fill the disk.
- **Filesystem permissions:** the storage directory is not world-readable/writable; the Node process runs as a dedicated non-root user scoped only to the paths it needs.
- **Malware scanning:** since this accepts public file uploads from customers, running uploaded images through a scanner (e.g., ClamAV) before they're accepted is worth the operational overhead. At minimum, files are always served with an explicit `Content-Type` and `Content-Disposition` header so a browser never has a chance to interpret an uploaded file as executable script.
- **Disk space monitoring:** this is the main operational cost of choosing local storage over object storage — disk has a hard ceiling that object storage doesn't. Set up disk-usage alerting (see Section 8) well before it's actually full, and factor photo-upload growth into server sizing from day one.
- **Serving efficiently:** for the catalog/design images specifically (which are public, not sensitive, and reused across many visitors), consider fronting the file-serving route with a CDN or at least aggressive `Cache-Control`/`ETag` headers set by the backend — this recovers most of the performance benefit object storage+CDN would have given you, without moving the files off the server.

### 4.5 Performance Checklist → Implementation

- **Caching:** Redis cache-aside pattern for read-heavy, rarely-changing data — catalog listings, categories, pricing matrix, county/sub-county lists. Cache invalidated explicitly whenever an admin updates the underlying record (not just left to expire), to avoid stale prices going out.
- **Pagination:** every list endpoint (orders, disputes, designs) is cursor- or offset-paginated, never returns unbounded result sets.
- **Explicit columns:** no `SELECT *` in any query — always name required columns.
- **Compression:** `compression` middleware (gzip/brotli) enabled on all API responses, including served files.
- **Payload limits:** `express.json({ limit: '1mb' })` or similar for JSON bodies; file uploads handled separately by the streaming multer middleware described above, with their own size caps.
- **Background jobs:** anything slow or non-critical to the immediate HTTP response — sending SMS/email notifications, routing to print, reconciling rider payments, nightly backups — goes through a BullMQ queue backed by Redis, not processed inline in the request/response cycle.
- **Logging:** structured, asynchronous logging via `pino` (fast, non-blocking), with request correlation IDs; sensitive fields (tokens, phone numbers in some contexts, payment payloads) redacted from logs.
- **Monitoring:** expose a `/health` endpoint; wire up basic metrics (request duration, error rate, queue depth, **disk usage**) — Prometheus + Grafana if the client wants full observability, otherwise a lighter hosted APM is acceptable for v1.
- **Slow query visibility:** enable PostgreSQL's `log_min_duration_statement` in a staging/production-safe way to catch slow queries early.
- **Connection pooling:** tuned `pg.Pool` settings as noted above; never open a new client connection per request.

### 4.6 M-Pesa Integration Notes

- STK Push initiation endpoint creates an `orders` row (`pending_payment`) and an `mpesa_transactions` row with the `checkout_request_id`, before the customer even sees the phone prompt.
- The Daraja **callback** — not the frontend polling or the on-screen prompt — is the only source of truth for marking payment as successful. The callback handler is idempotent: if the same `checkout_request_id` is received twice, the second is a no-op.
- Callback endpoint validates payload signature/source per Safaricom's documented approach, and is excluded from CSRF protection (as an external callback) but included in strict rate limiting and logging.
- On confirmed success: update `orders.status = 'paid'`, enqueue notification job (appreciation message + delivery date + order number + contacts), enqueue print-routing job.

---

## 5. Frontend Implementation Rules (Next.js)

### 5.1 Structure & Design

- Next.js App Router, TypeScript throughout, Tailwind CSS for styling.
- Theme colours: black, pink, white — defined as Tailwind theme tokens (`tailwind.config.ts`), not hardcoded hex values scattered through components, so the palette stays consistent and easy to adjust.
- Modern look: clean typography, generous whitespace, subtle motion on interactive elements (hover/tap states, cart updates), mobile-first layout given most customers will order from a phone.
- Client-side cart state via a lightweight store (Zustand or React Context — avoid Redux for something this size), persisted to `localStorage` so a refresh doesn't lose the cart, and synced to the backend only at checkout.

### 5.2 Performance Checklist → Implementation

- **Images:** `next/image` for everything, configured with `remotePatterns` pointing at your own backend's file-serving domain (since images now come from your server's route, not a CDN/S3 URL) — you still get automatic responsive sizing, lazy loading, and modern-format conversion (WebP/AVIF) even with a self-hosted origin.
- **Fonts:** `next/font` for self-hosted, WOFF2 fonts with automatic preloading — avoids render-blocking external font requests and keeps web font weight in check.
- **Critical CSS / render-blocking:** Next.js + Tailwind's production build already extracts and minifies CSS and inlines critical styles per route — no manual intervention needed beyond not fighting the framework defaults (no large inline `<style>` blocks, no per-component runtime CSS-in-JS that defeats this).
- **JS:** rely on Next.js's automatic code-splitting per route; avoid large client-only bundles by keeping components server components by default and only marking interactive ones `"use client"`.
- **Minification/compression:** handled by the Next.js production build + hosting platform (enable gzip/brotli at the CDN/reverse-proxy level if self-hosting rather than using a platform that does it automatically).
- **Caching headers:** static assets (`/public`, build output) served with long `Cache-Control: immutable` headers; the backend's file-serving route sends appropriate `Cache-Control`/`ETag` headers for design images (long-lived, public, cacheable) versus customer photos and delivery notes (private, not cached by shared caches).
- **TTFB:** achieved primarily through backend query performance (see indexing above) and hosting the app close to users, rather than a frontend-only fix.
- **HTTPS:** enforced at hosting/CDN level.
- **No iframes**, no embedded/inline CSS outside Tailwind's compiled output, no Base64-encoded images (real image files served through `next/image` and the backend route).
- **Directory listings / unreachable files:** the storage directory is never statically served (Section 4.4), so there's no directory-listing risk by construction; run a periodic link-checker in CI so customers don't hit 404s on card images.

### 5.3 Key Pages/Flows

- `/` — landing, category highlights
- `/catalog` — filterable by occasion / style / religion, with the 360° preview on each card
- `/design/[id]` — full customization flow (size, message, colours, photo upload if applicable)
- `/cart` — review multiple items, edit/remove
- `/checkout` — delivery details per item, phone number, STK push trigger, payment status polling (with the callback-driven backend as the real source of truth)
- `/order/[orderNumber]` — status lookup (paid → routed → printing → dispatched → delivered)
- `/dispute` — submit a dispute with order number + M-Pesa code
- `/admin/*` — dashboard (separate layout, auth-gated)

---

## 6. Environment Variables (indicative)

```
# Server
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
REDIS_URL=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
STORAGE_ROOT_PATH=/server/storage
MAX_UPLOAD_SIZE_CUSTOMER_PHOTO_MB=5
MAX_UPLOAD_SIZE_DELIVERY_NOTE_MB=10
SMS_PROVIDER_API_KEY=
NODE_ENV=production

# Backups
BACKUP_DESTINATION=            # remote host/bucket used ONLY for backup storage, not app runtime
BACKUP_ENCRYPTION_KEY=
BACKUP_RETENTION_DAILY_DAYS=14
BACKUP_RETENTION_WEEKLY_WEEKS=8
BACKUP_RETENTION_MONTHLY_MONTHS=12

# Frontend
NEXT_PUBLIC_API_BASE_URL=
```

Secrets are never committed to the repo — `.env` files gitignored, real values injected via the hosting platform's secret manager.

---

## 7. Testing & CI/CD

- Unit tests for the SQL query layer (against a real test Postgres instance, not mocked — since correctness of raw SQL is exactly what needs verifying without an ORM's safety net).
- Integration tests for critical flows: STK push → callback → order status update; order creation → print routing; dispute submission; file upload → validation → storage → retrieval.
- Dependency vulnerability scanning (`npm audit` or Snyk/Dependabot) in CI.
- No self-approval on pull requests — at least one other review before merge, even on a small team.
- Migrations run automatically as part of deploy, with a documented rollback approach if a migration fails.
- Staging environment that mirrors production for testing the full M-Pesa sandbox flow before go-live.

---

## 8. Monitoring & Alerting

- `/health` endpoint checked by uptime monitoring.
- Alerts (email/Slack/SMS) on: server downtime, error-rate spikes, queue backlog growth, and — specific to the local-storage decision — **disk usage crossing a threshold (e.g., 75%)**, since this is the one resource that can silently run out and take uploads/backups down with it.
- Database slow-query log reviewed periodically, not just collected and ignored.

---

## 9. Backup System

Two things need protecting here, and both matter equally: the **database** (orders, payments, customers, admin data — effectively the whole business record) and the **local file storage** (design images, customer photos, delivery-note scans). Because files are stored on the server itself rather than in object storage, backups are the thing standing between a single disk failure and losing customer photos and proof-of-delivery records permanently — this section isn't optional polish, it's load-bearing given the storage decision above.

### 9.1 Database Backups

- Automated **daily full backups** via `pg_dump` (custom format, `-Fc`, which allows flexible/partial restore).
- **WAL (write-ahead log) archiving** enabled once the platform is handling real orders/payments, so recovery isn't limited to "whatever the last nightly snapshot was" — point-in-time recovery lets you restore to almost any moment, which matters once real money is moving through the system.
- Backups **encrypted at rest** before being moved off the server.
- Backups **shipped off the app server automatically** — to a separate, low-cost storage destination used *only* for backups (this is a reasonable, narrow exception to "no object storage," since it's not part of the application's runtime file-serving path — it's just an offsite copy) or to a second physical/virtual server via `rsync` if you'd rather avoid cloud storage entirely.
- **Retention policy** (adjustable): daily backups kept 14 days, weekly kept 8 weeks, monthly kept 12 months.
- **Automated restore testing** on a schedule (e.g., monthly) — a backup that has never been test-restored isn't a verified backup, it's an assumption.

### 9.2 File Storage Backups

- Nightly **incremental** backup of `/server/storage` (excluding `/tmp`) using a deduplicating, encrypted backup tool (`restic` or `borg` are good fits here) synced to the same off-server destination as the database backups.
- Incremental (not full-copy-every-night) matters because `customer-photos` and `delivery-notes` grow continuously — a full copy nightly gets expensive and slow fast; incremental keeps it practical as volume grows.
- Design/catalog images change rarely, so they're low-risk to lose relative to customer uploads, but are backed up on the same schedule for consistency and simplicity — one backup job, one schedule, one thing to monitor.
- Backup job runs as a scheduled background job (via the same job-queue infrastructure used for notifications/print-routing — Section 4.5), with failure alerts wired into the monitoring in Section 8. A silently failing backup job is worse than no backup job, because it creates false confidence.

### 9.3 Disaster Recovery

- Write down and actually rehearse the recovery sequence before go-live: server lost → provision new server → restore database from latest backup (+ WAL replay if applicable) → restore `/server/storage` from latest backup → redeploy app → verify. This should be a runbook someone unfamiliar with the system could follow, not tribal knowledge.
- Agree explicit targets with the client:
  - **Recovery Point Objective (RPO)** — how much data you can afford to lose (e.g., near-zero with WAL archiving, or "up to 24 hours" with nightly-only backups).
  - **Recovery Time Objective (RTO)** — how long the platform can be down before it's a real business problem.
  These two numbers determine how much backup/recovery infrastructure is actually justified — no need to over-build this for a launch-stage platform, but it should be a deliberate choice, not a gap nobody thought about.

---

## 10. Definition of Done (checklist to hold the build to)

- [ ] All raw SQL queries parameterized — zero string-concatenated queries anywhere.
- [ ] All tables have appropriate indexes on FK and filter/sort columns; verified with `EXPLAIN ANALYZE` on key queries.
- [ ] JWT access/refresh flow implemented with short TTL, rotation, and revocation support.
- [ ] Rate limiting active on login, STK push, dispute, and file-upload endpoints.
- [ ] Security headers (`helmet`) confirmed present on all responses.
- [ ] M-Pesa callback handling is idempotent and signature-validated.
- [ ] File uploads use disk streaming (not in-memory buffering), server-generated filenames, and content-type sniffing — verified under concurrent-upload load testing, not just a single manual test.
- [ ] Storage directory confirmed unreachable via direct URL — only accessible through the authenticated file-serving route.
- [ ] Lighthouse performance score checked on key pages (catalog, checkout) — targeting the < 500 KB / < 3 s load goals.
- [ ] Images served via `next/image`, fonts via `next/font`.
- [ ] Background jobs (notifications, print routing, backups) confirmed not blocking the request/response cycle.
- [ ] Logging redacts sensitive fields; no secrets or full card payloads in logs.
- [ ] Database and file-storage backups running on schedule, encrypted, shipped off-server, and a restore has been test-run at least once.
- [ ] Disk usage monitoring/alerting is live before go-live, not added after a near-miss.
- [ ] Staging M-Pesa sandbox flow tested end-to-end before production go-live.