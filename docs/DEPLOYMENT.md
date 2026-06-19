# ServiceHub — Deployment Guide

This guide takes ServiceHub from a local monorepo to a live, internet-reachable
deployment: the **backend API** + **MySQL**, the **admin panel**, the **customer
website**, and the **Expo mobile app**.

It uses popular, **free-tier-friendly** providers as the primary path (Railway/Render
for the API + DB, Vercel for both Next.js apps, EAS for mobile), and notes solid
alternatives for each. All commands are concrete; substitute your own hostnames where
shown as `<...>`.

> **Source of truth.** Run commands, ports, and env var names below come from each
> sub-project's README and source:
> [`backend`](../backend/README.md) · [`web/admin`](../web/admin/README.md) ·
> [`web/site`](../web/site/README.md) · [`mobile`](../mobile/README.md).

---

## 1. Overview & recommended topology

ServiceHub is **one backend** serving **three clients**. Everything talks to the API over
HTTPS with a JWT bearer token. The clients are thin views over the same contract, so the
only "wiring" at deploy time is pointing each client's API base URL at the **public**
backend origin, and allowing each client's origin in the backend's CORS allowlist.

```
                          ┌─────────────────────────────┐
                          │            Users            │
                          └──────┬───────────┬──────────┘
            phones / app stores  │           │  browsers
                                 ▼           ▼
   ┌───────────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Mobile (Expo)    │  │  Admin panel │  │ Customer site│
   │  EAS Build / OTA  │  │  Vercel      │  │  Vercel      │
   │  CUSTOMER         │  │  (Next.js)   │  │  (Next.js)   │
   └─────────┬─────────┘  └──────┬───────┘  └──────┬───────┘
             │                   │                 │
             │   HTTPS + JWT (Authorization: Bearer <token>)
             └───────────────────┼─────────────────┘
                                 ▼
                ┌──────────────────────────────────┐
                │   Backend API  (Railway/Render)   │
                │   Node + TS + Express + Sequelize │
                │   https://api.<your-domain>/api/v1│
                │   binds 0.0.0.0 : $PORT           │
                └─────────────────┬─────────────────┘
                                  ▼
                ┌──────────────────────────────────┐
                │   Managed MySQL 8                 │
                │   (Railway / Render / PlanetScale)│
                │   private network, daily backups  │
                └──────────────────────────────────┘
```

### Recommended placement

| Piece | Recommended host | Why | Alternatives |
|-------|------------------|-----|--------------|
| Backend API | **Railway** or **Render** (Web Service) | Long-lived Node process, easy env vars, runs migrations on deploy | Fly.io, AWS App Runner, a VPS + PM2, any Docker host |
| MySQL | **Railway MySQL** or **Render MySQL** (same provider as the API → private networking + free backups) | Lowest latency, no public DB exposure | PlanetScale (MySQL-compatible, generous free tier), Aiven, AWS RDS |
| Admin panel (`web/admin`) | **Vercel** (project #1) | First-class Next.js 14, free TLS + CDN | Netlify, Render Static/Web, Cloudflare Pages |
| Customer site (`web/site`) | **Vercel** (project #2, separate) | Same | Same as above |
| Mobile (`mobile`) | **EAS Build** + **EAS Update** (OTA); **Expo Go** for demos | Native binaries + OTA JS pushes without a Mac | Local `eas build --local`, classic stores |

> The two Next.js apps are **two separate Vercel projects** (different env values and
> different domains). Do not deploy them as one.

### Ports recap (local → cloud)

| Service | Local port | In the cloud |
|---------|-----------|--------------|
| Backend API | `4000` (path `/api/v1`, health `/health`) | Provider injects `$PORT`; bind `0.0.0.0` |
| Admin panel | `3000` | Vercel-managed HTTPS domain |
| Customer site | `3001` | Vercel-managed HTTPS domain |
| Mobile (Metro/Expo dev) | `8081` | n/a — built/OTA-delivered |

---

## 2. Backend API + MySQL

### 2.1 What gets built and run

From [`backend/package.json`](../backend/package.json):

| Script | Command | Use |
|--------|---------|-----|
| Build | `npm run build` | `tsc -p tsconfig.json` → emits `dist/` |
| Start | `npm start` | `node dist/server.js` |
| Migrate | `npm run db:migrate` | `sequelize-cli db:migrate` |
| Seed | `npm run db:seed` | `sequelize-cli db:seed:all` |
| Reset DB | `npm run db:reset` | undo-all → migrate → seed (destructive) |

The entrypoint is `dist/server.js`. It **authenticates the DB first, then listens** —
so it fails fast if the database is unreachable.

### 2.2 Binding to `0.0.0.0`

`src/server.ts` calls `app.listen(config.PORT, ...)` with **no host argument**. Node/Express
defaults to `0.0.0.0` (all interfaces), which is exactly what cloud platforms and the mobile
app on a phone need — `127.0.0.1` would be unreachable from outside the container. If you ever
want it explicit (e.g. on a VPS), change the listen call to:

```ts
app.listen(config.PORT, '0.0.0.0', () => { /* ... */ });
```

Always honor the platform-provided **`$PORT`** — never hard-code `4000` in production. The
env layer already does this: `PORT` is read from the environment and defaults to `4000` only
when unset.

### 2.3 Environment variables to set

Validated by `src/config/env.ts` (the app **exits on a missing/invalid var**). Mirror of
[`backend/.env.example`](../backend/.env.example):

| Variable | Required | Example (production) | Notes |
|----------|----------|----------------------|-------|
| `NODE_ENV` | yes | `production` | Disables SQL logging; enables prod behavior |
| `PORT` | platform | `$PORT` (injected) | Bind to this; defaults to `4000` locally |
| `DB_HOST` | yes | `containers-us-west-1.railway.app` | From your MySQL provider |
| `DB_PORT` | yes | `3306` | |
| `DB_NAME` | yes | `servicehub` | |
| `DB_USER` | yes | `servicehub` | |
| `DB_PASSWORD` | yes | `<strong-generated>` | Never commit |
| `JWT_SECRET` | yes | `<64-hex-random>` | **Min 16 chars** or the app won't boot |
| `JWT_EXPIRES_IN` | no | `7d` | |
| `BCRYPT_SALT_ROUNDS` | no | `10` | 8–15 |
| `CORS_ORIGINS` | yes | `https://admin.x.com,https://www.x.com` | Comma-separated, **deployed web origins** |
| `AUTH_RATE_LIMIT_WINDOW_MS` | no | `60000` | Login throttle window |
| `AUTH_RATE_LIMIT_MAX` | no | `10` | Max auth attempts per window |
| `LOG_LEVEL` | no | `combined` | Use `combined` for prod-style access logs |

> **CORS is load-bearing.** `src/app.ts` does `cors({ origin: config.CORS_ORIGINS })`.
> `CORS_ORIGINS` must list the **exact deployed origins** of the admin panel and site
> (scheme + host, **no trailing slash, no path**), e.g.
> `https://servicehub-admin.vercel.app,https://servicehub-site.vercel.app`.
> Native apps (Expo) don't send a browser `Origin`, so they don't need a CORS entry — but
> they **do** need the API to be publicly reachable over HTTPS.

Generate a real secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2.4 Migrations & seed in the deploy step

`sequelize-cli` reads `src/config/database.js` (declared in `.sequelizerc`), which loads
`DB_*` from the environment. The CLI keys off `NODE_ENV` to pick the config block, so
**migrations and seeds must run with the same env as the app** (`NODE_ENV=production` plus
the `DB_*` vars).

Run order on each deploy:

```bash
npm ci                 # clean install
npm run build          # tsc → dist/
npm run db:migrate     # create/upgrade tables (idempotent)
npm run db:seed        # roles, demo users, categories, services
npm start              # node dist/server.js
```

> **Seeding is for a fresh demo DB.** Run `db:seed` once on first deploy. Re-running can
> create duplicate rows; keep migrations in the per-deploy step but make seeding a one-time
> (or guarded) action for real environments. Do **not** keep `db:reset` anywhere near a
> production deploy — it drops everything.

### 2.5 Deploy on Railway (primary example)

Railway can host the MySQL **and** the API on one private network.

```bash
# install + log in
npm i -g @railway/cli
railway login

# from repo root
cd backend
railway init                 # create a project
railway add --database mysql # provisions MySQL; exposes MYSQL* / connection vars
```

Then in the Railway dashboard for the **API service**:

1. **Root directory:** `backend`.
2. **Build command:** `npm run build`.
3. **Start command** (runs migrate+seed once, then boots):
   ```bash
   npm run db:migrate && npm run db:seed && npm start
   ```
   After the first successful deploy, change the start command to just
   `npm run db:migrate && npm start` so seeds don't re-run.
4. **Variables** — set the table from §2.3. Map Railway's MySQL plugin vars to ours:
   `DB_HOST=${{MySQL.MYSQLHOST}}`, `DB_PORT=${{MySQL.MYSQLPORT}}`,
   `DB_NAME=${{MySQL.MYSQLDATABASE}}`, `DB_USER=${{MySQL.MYSQLUSER}}`,
   `DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}`. Add `NODE_ENV=production`, a real `JWT_SECRET`,
   and `CORS_ORIGINS`.
5. **Networking → Generate Domain.** Note the URL, e.g.
   `https://servicehub-api-production.up.railway.app`. Your API base for clients is that URL
   **+ `/api/v1`**.

Deploy with `railway up` (or connect the GitHub repo for push-to-deploy).

### 2.6 Deploy on Render (alternative example)

Add a **`render.yaml`** at the repo root (Blueprint deploy):

```yaml
services:
  - type: web
    name: servicehub-api
    runtime: node
    rootDir: backend
    plan: free
    buildCommand: npm ci && npm run build
    # First deploy: include `&& npm run db:seed` after migrate, then remove it.
    startCommand: npm run db:migrate && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true        # Render generates a strong secret
      - key: CORS_ORIGINS
        sync: false                 # set in dashboard once web origins exist
      - key: DB_HOST
        fromDatabase: { name: servicehub-mysql, property: host }
      - key: DB_PORT
        fromDatabase: { name: servicehub-mysql, property: port }
      - key: DB_NAME
        fromDatabase: { name: servicehub-mysql, property: database }
      - key: DB_USER
        fromDatabase: { name: servicehub-mysql, property: user }
      - key: DB_PASSWORD
        fromDatabase: { name: servicehub-mysql, property: password }
```

> Render's managed **MySQL** is provisioned as a separate resource; on the free tier
> consider **PlanetScale** (MySQL-compatible) if you prefer. PlanetScale gives you
> `DB_HOST`/`DB_USER`/`DB_PASSWORD` and requires TLS — Sequelize + `mysql2` connect over
> TLS automatically to PlanetScale's hostname; if you self-manage certs add
> `dialectOptions: { ssl: { rejectUnauthorized: true } }` in `src/config/sequelize.ts`.

### 2.7 Dockerfile (portable: Fly.io, App Runner, any container host)

Place at `backend/Dockerfile`:

```dockerfile
# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build              # tsc → dist/

# ---- runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
# dist + the CJS sequelize config/migrations/seeders the CLI needs at runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/config/database.js ./src/config/database.js
COPY .sequelizerc ./
# sequelize-cli is a dev dep; keep it available for migrations:
RUN npm i --no-save sequelize-cli
EXPOSE 4000
# migrate on boot, then start. (Seed once manually on first deploy.)
CMD ["sh", "-c", "npm run db:migrate && node dist/server.js"]
```

Run it:

```bash
docker build -t servicehub-api ./backend
docker run --rm -p 4000:4000 --env-file ./backend/.env.production servicehub-api
```

> The container reads `$PORT` from the env; if your platform injects a different port,
> pass it (`-e PORT=8080 -p 8080:8080`). Because the server binds `0.0.0.0`, it's reachable
> from outside the container.

---

## 3. Admin panel & Customer site (Next.js → Vercel)

Both apps are **Next.js 14 App Router**, build with `npm run build`, serve with `npm start`,
and read two **public** env vars. They are **two separate Vercel projects**.

### 3.1 Build / start (any host)

```bash
cd web/admin   # or web/site
npm ci
npm run build  # production build; type-checks every route
npm start      # admin → :3000, site → :3001
```

### 3.2 Environment variables

| Variable | Admin value | Site value | Purpose |
|----------|-------------|-----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.<your-domain>/api/v1` | `https://api.<your-domain>/api/v1` | **Deployed API origin, including `/api/v1`** |
| `NEXT_PUBLIC_TOKEN_KEY` | `servicehub.admin.token` | `servicehub.site.token` | localStorage key for the JWT (namespaced per app) |

> `NEXT_PUBLIC_*` vars are **inlined at build time**. If you change the API URL, you must
> **redeploy** (rebuild) the Vercel project. The base URL **must include `/api/v1`** and have
> **no trailing slash** after it. Keep the two `TOKEN_KEY` values distinct so admin and site
> tokens never collide on a shared domain.

### 3.3 Deploy each as its own Vercel project

```bash
npm i -g vercel
vercel login

# Project 1: ADMIN
cd web/admin
vercel link                 # create/link a project, e.g. "servicehub-admin"
vercel env add NEXT_PUBLIC_API_BASE_URL production   # paste https://api.../api/v1
vercel env add NEXT_PUBLIC_TOKEN_KEY  production      # servicehub.admin.token
vercel --prod               # build + deploy → https://servicehub-admin.vercel.app

# Project 2: SITE  (repeat in a separate project)
cd ../site
vercel link                 # e.g. "servicehub-site"
vercel env add NEXT_PUBLIC_API_BASE_URL production   # same API base
vercel env add NEXT_PUBLIC_TOKEN_KEY  production      # servicehub.site.token
vercel --prod               # → https://servicehub-site.vercel.app
```

When importing from the Git UI instead, set each project's **Root Directory** to
`web/admin` and `web/site` respectively (Framework Preset: Next.js, default build/output).

### 3.4 Close the CORS loop

Once you know the two Vercel URLs, set them on the **backend**:

```
CORS_ORIGINS=https://servicehub-admin.vercel.app,https://servicehub-site.vercel.app
```

Redeploy the backend so the new allowlist takes effect. Add any custom domains
(`https://admin.example.com`) as additional comma-separated entries.

> **Alternatives:** Netlify and Cloudflare Pages both deploy Next.js 14; set the same two
> env vars and per-project root directories.

---

## 4. Mobile app (Expo / React Native)

The app reads the API URL from `EXPO_PUBLIC_API_BASE_URL`, surfaced via
`app.config.ts` → `extra.apiBaseUrl` (see [`mobile/app.config.ts`](../mobile/app.config.ts)).
For real builds and OTA, this **must point at the PUBLIC backend URL** — not a LAN IP.

| Variable | Value (production) | Notes |
|----------|--------------------|-------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.<your-domain>/api/v1` | Public HTTPS API origin, **ending in `/api/v1`** |

> `EXPO_PUBLIC_*` is inlined at **bundle time** — set it in your EAS build/update profile (or
> `eas.json` env), and rebuild/republish after changing it. A LAN IP like
> `http://192.168.x.x:4000` only works for local dev; a shipped app must hit the public URL
> over HTTPS (iOS App Transport Security blocks plain HTTP by default).

### 4.1 One-time EAS setup

```bash
cd mobile
npm i -g eas-cli
eas login
eas build:configure        # creates eas.json with build profiles
```

A minimal `mobile/eas.json` that bakes the public API URL into each profile:

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_BASE_URL": "https://api.your-domain.com/api/v1" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_BASE_URL": "https://api.your-domain.com/api/v1" }
    }
  },
  "submit": { "production": {} }
}
```

### 4.2 Build native binaries with EAS Build

```bash
# Android APK/AAB (cloud build — no Android Studio needed)
eas build -p android --profile preview      # shareable .apk for testers
eas build -p android --profile production    # .aab for Google Play

# iOS (cloud build — no Mac needed; needs an Apple Developer account to sign)
eas build -p ios --profile production

# both at once
eas build -p all --profile production
```

EAS returns a download/build URL. Submit to stores with `eas submit -p android` /
`eas submit -p ios`, or share the `preview` APK link directly with testers.

### 4.3 OTA updates (publish JS without a new binary)

For JS-only changes (no native module changes), push over-the-air:

```bash
# modern EAS Update (recommended)
eas update --branch production --message "Fix booking date picker"
```

EAS Update delivers the new bundle to installed apps on next launch. The classic
`expo publish` command is **deprecated** on SDK 56 — prefer `eas update`. Configure it once:

```bash
eas update:configure
```

> Re-run `eas update` whenever you change `EXPO_PUBLIC_API_BASE_URL`, since it's inlined into
> the bundle. Native config changes (new permissions, native deps) require a fresh
> `eas build`, not just an update.

### 4.4 Expo Go path (fastest demo, no build)

For a quick reviewer/demo run without any store or binary:

```bash
cd mobile
npm install
# point at the PUBLIC API so testers off your network can use it:
echo 'EXPO_PUBLIC_API_BASE_URL=https://api.your-domain.com/api/v1' > .env
npx expo start            # scan the QR with Expo Go
```

To share the QR with someone off your Wi-Fi, use a tunnel: `npx expo start --tunnel`.
If you edited `.env`, restart with `npx expo start --clear` (env is inlined at bundle time).
Sign in with the seeded customer: `customer1@servicehub.test` / `Customer@12345`.

---

## 5. Production hardening checklist

- [ ] **Real `JWT_SECRET`** — a 48+ byte random value
      (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`),
      not the `change-me-...` placeholder. The app refuses to boot below 16 chars.
- [ ] **HTTPS everywhere** — API, admin, and site served over TLS. Railway/Render/Vercel
      provide certs automatically; mobile must use `https://` (iOS ATS blocks plain HTTP).
- [ ] **CORS allowlist is exact** — `CORS_ORIGINS` lists only the real deployed web origins
      (scheme+host, no trailing slash, no `*`). Remove `localhost` entries in production.
- [ ] **`NODE_ENV=production`** — set on the API service and wherever migrations/seeds run
      (it selects the prod Sequelize config and disables SQL query logging).
- [ ] **Database backups** — enable automated daily backups/snapshots on your MySQL provider
      and verify a restore at least once.
- [ ] **Rate limits** — keep `express-rate-limit` on auth routes; tune
      `AUTH_RATE_LIMIT_WINDOW_MS` / `AUTH_RATE_LIMIT_MAX` (defaults 60s / 10) for your traffic.
- [ ] **Never commit secrets** — `.env` files are gitignored; only `*.env.example` are
      committed. Set real values in each platform's secret manager. Verify with
      `git check-ignore backend/.env` and `git log -- backend/.env` (should be empty).
- [ ] **Rotate seeded demo passwords** — the seed creates `admin@servicehub.test /
      Admin@12345`, `provider1@…`, `customer1@…`. Change these immediately in any
      internet-facing deploy (or don't seed demo users at all in production).
- [ ] **Don't run `db:reset` / re-`db:seed`** against a live DB — both are destructive or
      duplicate-producing. Keep only `db:migrate` in the per-deploy step.
- [ ] **`helmet` enabled** (it is, in `src/app.ts`) — leave it on; consider tightening CSP if
      you later serve any HTML from the API.
- [ ] **Private DB networking** — keep MySQL on the provider's private network; don't expose
      it publicly. If a public host is required (PlanetScale), enforce TLS.
- [ ] **Pin Node 20** — `engines.node >= 20`; set the platform's Node version to 20 to match.

---

## 6. Smoke test after deploy

Set a base for convenience, then verify the API, auth, and a protected route end-to-end.

```bash
API="https://api.your-domain.com"     # NO /api/v1 here; we add it per call

# 1) Health probe (outside the version prefix) → {"status":"ok","uptime":...}
curl -fsS "$API/health"

# 2) API meta root → confirms the versioned router is mounted
curl -fsS "$API/api/v1"

# 3) Log in as the seeded admin → grab the JWT
TOKEN=$(curl -fsS -X POST "$API/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@servicehub.test","password":"Admin@12345"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data?.token ?? JSON.parse(require("fs").readFileSync(0)).token')
echo "token: ${TOKEN:0:16}..."

# 4) Hit a protected route with the bearer token → your own user record
curl -fsS "$API/api/v1/auth/me" -H "Authorization: Bearer $TOKEN"

# 5) Hit an ADMIN-only route → dashboard counts (proves RBAC + DB read)
curl -fsS "$API/api/v1/admin/stats" -H "Authorization: Bearer $TOKEN"

# 6) Public read (no auth) → seeded catalog is present
curl -fsS "$API/api/v1/services?limit=3"
```

Expected: step 1 returns `status: ok`; step 3 returns a token; steps 4–5 return JSON (a 401
means the token/header is wrong, a 403 means RBAC rejected a non-admin); step 6 returns seeded
services. If `db:seed` didn't run, steps 5–6 succeed but return empty lists.

**Browser checks:**

1. Open the **admin** Vercel URL → log in with `admin@servicehub.test / Admin@12345` → the
   dashboard loads real counts. (A blank dashboard or network errors in the console usually
   means `NEXT_PUBLIC_API_BASE_URL` is wrong or the origin isn't in `CORS_ORIGINS`.)
2. Open the **site** Vercel URL → browse `/services` as a guest, then log in with
   `customer1@servicehub.test / Customer@12345` and view `/bookings`.
3. Launch the **mobile** app (Expo Go or an EAS build) → log in as the customer → the service
   list loads from the public API.

If any client shows "Network Error", check (a) the client's `*_API_BASE_URL` ends in
`/api/v1` and is HTTPS, and (b) for the web apps, the exact origin is present in the backend
`CORS_ORIGINS`.

---

## 7. Deploy order (summary)

1. **MySQL** — provision managed MySQL; note `DB_*`.
2. **Backend** — set env (incl. `JWT_SECRET`, `NODE_ENV=production`, placeholder
   `CORS_ORIGINS`); `build → db:migrate → db:seed (once) → start`; get the public API URL.
3. **Admin & Site** — two Vercel projects; set `NEXT_PUBLIC_API_BASE_URL=<api>/api/v1` +
   each `NEXT_PUBLIC_TOKEN_KEY`; deploy; note both URLs.
4. **Close CORS** — set backend `CORS_ORIGINS` to the two web URLs; redeploy backend.
5. **Mobile** — set `EXPO_PUBLIC_API_BASE_URL=<api>/api/v1`; `eas build` and/or `eas update`,
   or Expo Go for a demo.
6. **Smoke test** — run §6; then complete the §5 hardening checklist.
