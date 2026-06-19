# ServiceHub — Backend API

REST API for the **ServiceHub On-Demand Service App**. Customers browse service
categories and book providers; providers accept/reject and fulfil bookings;
admins manage users, catalog, bookings, payments and view stats.

## Tech stack

- **Runtime:** Node.js 20+ (Node 18+ supported)
- **Language:** TypeScript (strict)
- **Framework:** Express 4
- **ORM:** Sequelize 6 + `mysql2`
- **Database:** MySQL / MariaDB
- **Validation:** zod
- **Auth:** JSON Web Tokens (HS256) via `jsonwebtoken`, passwords hashed with `bcryptjs` (cost 10)
- **Security/util:** helmet, cors, morgan, express-rate-limit, dotenv

Roles: `CUSTOMER`, `PROVIDER`, `ADMIN`.
Booking lifecycle: `PENDING → ACCEPTED / REJECTED → IN_PROGRESS → COMPLETED / CANCELLED`.

## Prerequisites

- Node.js 18+ (20+ recommended) and npm
- A running MySQL 8 or MariaDB 10.4+ server

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create the database (uses values from .env via sequelize-cli)
npm run db:create        # or manually: CREATE DATABASE servicehub;

# 3. Configure environment
cp .env.example .env      # then edit .env and fill in real values
#    (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, ...)

# 4. Run migrations (create tables)
npm run db:migrate

# 5. Seed sample data (roles, users, categories, services, ...)
npm run db:seed

# 6. Start the dev server (ts-node-dev, auto-reload)
npm run dev
```

The API then listens on **http://localhost:4000**.

Production build: `npm run build` then `npm start`.
Type-check only: `npm run typecheck`.
Reset DB (undo all → migrate → seed): `npm run db:reset`.

## API base URL

```
http://localhost:4000/api/v1
```

A health probe is exposed (outside the version prefix) at `GET /health`, and the
API meta root responds at `GET /api/v1`.

## Sample credentials (seeded)

All seeded accounts use the demo passwords below (stored as bcrypt hashes).

```
Sample credentials (seeded):
  Admin     → admin@servicehub.test     / Admin@12345
  Provider  → provider1@servicehub.test / Provider@12345
  Customer  → customer1@servicehub.test / Customer@12345
```

Additional seeded accounts: `provider2@servicehub.test / Provider@12345`,
`customer2@servicehub.test / Customer@12345`.

Authenticate via `POST /api/v1/auth/login` to obtain a JWT, then send it as
`Authorization: Bearer <token>` on protected endpoints.

## Endpoint summary

All paths below are relative to the base URL `http://localhost:4000/api/v1`.

| Area | Method & Path | Roles |
|------|---------------|-------|
| **Auth** | `POST /auth/register` | Public |
| | `POST /auth/login` | Public |
| | `POST /auth/logout` | Authenticated |
| | `POST /auth/refresh` | Authenticated (501 MVP) |
| | `GET /auth/me` | Authenticated |
| **Profile** | `GET /profile` · `PATCH /profile` · `PATCH /profile/password` | Authenticated (own) |
| | `GET /profile/provider` · `PUT /profile/provider` | PROVIDER (own), ADMIN |
| **Users** | `GET /users` · `POST /users` · `GET /users/:id` · `PATCH /users/:id` | ADMIN |
| | `PATCH /users/:id/status` · `PATCH /users/:id/role` | ADMIN |
| **Categories** | `GET /categories` · `GET /categories/:id` | Public |
| | `POST /categories` · `PATCH /categories/:id` · `DELETE /categories/:id` | ADMIN |
| **Services** | `GET /services` · `GET /services/:id` | Public |
| | `POST /services` · `PATCH /services/:id` · `PATCH /services/:id/price` · `DELETE /services/:id` | ADMIN |
| **Bookings** | `POST /bookings` | CUSTOMER, ADMIN |
| | `GET /bookings` · `GET /bookings/:id` | CUSTOMER/PROVIDER (own), ADMIN |
| | `PATCH /bookings/:id` | CUSTOMER (own/PENDING), ADMIN |
| | `POST /bookings/:id/accept` · `/reject` · `/start` · `/complete` | PROVIDER, ADMIN |
| | `POST /bookings/:id/cancel` | CUSTOMER (own), ADMIN |
| | `PATCH /bookings/:id/status` · `PATCH /bookings/:id/assign` | ADMIN |
| **Provider availability** | `GET /provider-availability` · `POST /provider-availability` | PROVIDER (own), ADMIN |
| | `PATCH /provider-availability/:id` · `DELETE /provider-availability/:id` | PROVIDER (own), ADMIN |
| | `GET /providers/:providerId/availability` | Public |
| **Admin stats** | `GET /admin/stats` · `GET /admin/stats/bookings` | ADMIN |
| **Payments** | `POST /bookings/:id/payment` · `GET /bookings/:id/payment` | CUSTOMER (own), ADMIN |
| | `GET /payments` · `GET /payments/:id` | ADMIN |
| **Notifications** | `GET /notifications` | Authenticated (own) |
| | `PATCH /notifications/:id/read` · `PATCH /notifications/read-all` · `DELETE /notifications/:id` | Authenticated (own) |
| **System** | `GET /health` (no prefix) · `GET /api/v1` | Public |

Full request/response contracts are exercised by the Postman collection (see below); RBAC and
per-field validation are enforced in `src/middlewares` and `src/validators`.

## Postman collection

A Postman collection covering all 53 endpoints (with the base URL and a bearer
token variable) is provided alongside the project for manual exploration and
grading. Import it into Postman, set the `baseUrl` variable to
`http://localhost:4000/api/v1`, log in via `POST /auth/login`, and store the
returned JWT in the collection's `token` variable to exercise the protected
routes.
