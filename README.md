# ServiceHub — On-Demand Service Application

A full-stack **on-demand home-services platform** (Urban-Company / "Uber-for-services" style) where
**customers** browse and book services, **providers** accept and fulfil jobs, and **admins** manage
users, the service catalog, pricing, and bookings.

One backend REST API serves four clients: a **React Native mobile app** (customers), a **Next.js
website** (customers — mirrors the mobile app), a **Next.js provider portal** (providers manage
their jobs & availability), and a **Next.js admin panel** (admins).

> Built as a Full Stack Developer assignment. The full product spec and architecture decisions live
> in [`planning/`](planning/) (master PRD, database schema, API contract, and per-surface PRDs).

---

## Architecture

```
 ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
 │ Mobile app     │ │ User website   │ │ Provider portal│ │ Admin panel    │
 │ (Expo / RN)    │ │ (Next.js :3001)│ │ (Next.js :3002)│ │ (Next.js :3000)│
 │ CUSTOMER       │ │ CUSTOMER       │ │ PROVIDER       │ │ ADMIN          │
 └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
         │                  │   REST + JWT      │                  │
         └──────────────────┴────────┬──────────┴──────────────────┘
                                      ▼
                     ┌────────────────────────────────┐
                     │  Backend API (:4000/api/v1)     │
                     │  Node + TypeScript + Express     │
                     │  Sequelize ORM · RBAC · JWT      │
                     └────────────────┬─────────────────┘
                                      ▼
                               ┌──────────────┐
                               │   MySQL DB   │
                               └──────────────┘
```

Role-based access control (`CUSTOMER` / `PROVIDER` / `ADMIN`) is enforced on every request by the
API — the clients are thin views over the same contract.

---

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | Node.js · TypeScript · Express · Sequelize · MySQL | Required stack; layered REST API with an ORM over a relational schema |
| **Auth** | JWT (HS256) · bcryptjs · RBAC middleware | Stateless auth; role + ownership enforcement |
| **Admin panel** | Next.js 14 (App Router) · TypeScript · React Query · Tailwind | Required; CSR dashboard behind auth |
| **User website** | Next.js 14 · TypeScript · React Query · Tailwind | Bonus; mirrors the mobile customer journey |
| **Provider portal** | Next.js 14 · TypeScript · React Query · Tailwind | Providers manage jobs (accept/reject/start/complete), availability, profile |
| **Mobile app** | React Native (Expo SDK 56) · TypeScript · React Query · React Navigation | Required; one TS codebase for iOS + Android |
| **Validation** | zod (server + web forms) · react-hook-form (forms) | One validation model mirrored client + server |

---

## Repository structure

```
.
├── backend/            # Node + TS + Express + Sequelize REST API (53 endpoints)
├── web/
│   ├── admin/          # Next.js admin panel (ADMIN)            — required
│   ├── site/           # Next.js customer website (CUSTOMER)    — bonus
│   └── provider/       # Next.js provider portal (PROVIDER)     — jobs/availability/profile
├── mobile/             # React Native (Expo) customer app       — required
├── db/                 # schema.sql + seed dump (canonical source = backend migrations)
├── docs/postman/       # Postman collection for the API
├── planning/           # PRDs: master, schema, API contract, backend/web/RN, execution plan
└── README.md           # you are here
```

Each sub-project has its **own README** with detailed, app-specific instructions:
[backend](backend/README.md) · [web/admin](web/admin/README.md) · [web/site](web/site/README.md) · [web/provider](web/provider/README.md) · [mobile](mobile/README.md)

---

## Quick start

**Prerequisites:** Node.js 18+, npm, and a MySQL/MariaDB server.

### 1. Backend (start this first)
```bash
cd backend
npm install
cp .env.example .env        # set DB credentials + JWT_SECRET
npm run db:create           # or: CREATE DATABASE servicehub;
npm run db:migrate          # build the schema
npm run db:seed             # insert sample data + accounts
npm run dev                 # → http://localhost:4000  (API at /api/v1)
```

### 2. Admin panel
```bash
cd web/admin
npm install
cp .env.example .env.local  # NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
npm run dev                 # → http://localhost:3000
```

### 3. User website
```bash
cd web/site
npm install
cp .env.example .env.local
npm run dev                 # → http://localhost:3001
```

### 4. Provider portal
```bash
cd web/provider
npm install
cp .env.example .env.local
npm run dev                 # → http://localhost:3002
```

### 5. Mobile app
```bash
cd mobile
npm install
cp .env.example .env        # EXPO_PUBLIC_API_BASE_URL=http://<YOUR-LAN-IP>:4000/api/v1
npx expo start              # scan the QR with Expo Go on your phone
```
> On a physical phone, `localhost` means the phone — use your **computer's LAN IP** (and keep the
> phone on the same Wi-Fi). Android emulator uses `http://10.0.2.2:4000/api/v1`. See
> [mobile/README.md](mobile/README.md).

---

## Sample credentials (seeded)

All demo accounts; passwords are stored as bcrypt hashes.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@servicehub.test` | `Admin@12345` |
| Provider | `provider1@servicehub.test` | `Provider@12345` |
| Customer | `customer1@servicehub.test` | `Customer@12345` |

(Also seeded: `provider2@…` and `customer2@…` with the same `…@12345` pattern.)

---

## API

Base URL: **`http://localhost:4000/api/v1`** · Health: `GET /health` · 53 endpoints.

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · logout · refresh |
| Profile | `GET/PATCH /profile` · `PATCH /profile/password` · `GET/PUT /profile/provider` |
| Users *(admin)* | `GET/POST /users` · `GET/PATCH /users/:id` · `/status` · `/role` |
| Categories | `GET /categories[/:id]` · admin `POST/PATCH/DELETE` |
| Services | `GET /services[/:id]` · admin `POST/PATCH/DELETE` · `PATCH /services/:id/price` |
| Bookings | `POST/GET /bookings` · `GET/PATCH /bookings/:id` · transitions `accept/reject/start/complete/cancel` · admin `status`/`assign` |
| Availability | `GET/POST/PATCH/DELETE /provider-availability` · public `GET /providers/:id/availability` |
| Admin | `GET /admin/stats` · `GET /admin/stats/bookings` |
| Payments *(mocked)* | `POST/GET /bookings/:id/payment` · `GET /payments[/:id]` |
| Notifications *(mocked)* | `GET /notifications` · `PATCH /:id/read` · `/read-all` · `DELETE /:id` |

Full request/response shapes, the RBAC matrix, and validation rules:
[planning/02-API-CONTRACT.md](planning/02-API-CONTRACT.md). Importable
[Postman collection](docs/postman/ServiceHub.postman_collection.json) (the Login request auto-saves
the JWT for authenticated calls).

---

## Database

Tables: `roles`, `users`, `provider_profiles`, `provider_availability`, `categories`, `services`,
`bookings`, `payments`, `notifications`. Booking lifecycle:
`PENDING → ACCEPTED / REJECTED → IN_PROGRESS → COMPLETED / CANCELLED`.

Schema SQL + seed dump in [`db/`](db/); ERD + per-column docs in
[planning/01-DATABASE-SCHEMA.md](planning/01-DATABASE-SCHEMA.md).

---

## Feature coverage

**Core (required) — done**
- Customer mobile app: auth, browse services, book with date/time, history + status, profile
- Provider portal: accept/reject/start/complete assigned jobs, manage availability & profile
- Admin panel: login, manage users & providers, categories, services + pricing, bookings, dashboard counts
- REST APIs for auth/users/services/bookings with role-based access, validation, centralized errors
- Relational schema with migrations + seeders

**Bonus — done:** customer website (mobile parity) · provider portal · mocked payment flow · mocked push notifications · automated tests (Jest + supertest, 29 passing) · deployment guide ([docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)) · Postman collection
**Bonus — not done:** an *actually-hosted* live demo (step-by-step deploy instructions are provided instead)

---

## Note on AI-assisted development

This project was built with **Claude Code** using a deliberate, reviewable process — which is the
point of the exercise (use modern AI tooling, but ship understandable, production-ready code):

1. **PRD-first.** Before any code, a complete spec set was written and **audited for cross-document
   consistency and requirement coverage** ([`planning/`](planning/)). The database schema and API
   contract are the single source of truth every client builds against.
2. **Sequenced build** (Schema → Backend → Web → React Native), each layer implemented against the
   shared contract so names/types never drift.
3. **Verification gates, not vibes.** The backend was tested against a live database (auth, RBAC,
   the booking state machine); both web apps were validated with a headless-browser end-to-end run
   (login → real data) plus `next build`; the mobile app passes `tsc` and a Metro bundle build.

The output is conventional, hand-reviewable TypeScript — no generated black boxes.
