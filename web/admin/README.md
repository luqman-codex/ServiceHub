# ServiceHub Admin Panel

Operational control panel for ServiceHub. ADMIN users manage users, providers,
service categories, services, bookings, and payments, and view dashboard analytics.

The admin panel consumes the live ServiceHub REST API and rejects any non-ADMIN
login at the UI layer.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **@tanstack/react-query v5** — server-state, caching, invalidation
- **axios** — API client with auth-token + error interceptors
- **react-hook-form** + **zod** (`@hookform/resolvers`) — forms & validation
- **Tailwind CSS 3** — styling and design tokens
- **lucide-react** — icons
- **recharts** — dashboard charts
- **sonner** — toast notifications
- **date-fns** — date formatting

## Prerequisites

- Node.js 18.18+ (or 20+) and npm
- The **ServiceHub backend API running at `http://localhost:4000`**
  (base URL `http://localhost:4000/api/v1`). The admin panel will not load data
  without it.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy the example, then edit if needed)
cp .env.example .env.local

# 3. Start the dev server (runs on http://localhost:3000)
npm run dev
```

Then open http://localhost:3000 and sign in.

### Environment variables (`.env.local`)

| Variable                    | Value                            | Purpose                                   |
| --------------------------- | -------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  | `http://localhost:4000/api/v1`   | REST API base (includes the version path) |
| `NEXT_PUBLIC_TOKEN_KEY`     | `servicehub.admin.token`         | localStorage key for the JWT              |

### Admin login

| Email                    | Password      |
| ------------------------ | ------------- |
| `admin@servicehub.test`  | `Admin@12345` |

## Scripts

| Command         | Description                                   |
| --------------- | --------------------------------------------- |
| `npm run dev`   | Start the dev server on port 3000             |
| `npm run build` | Production build (type-checks every route)    |
| `npm run start` | Serve the production build                    |
| `npm run lint`  | Run ESLint                                    |

## Routes

### Auth (`(auth)` route group — unauthenticated)

| Route     | Description                                          |
| --------- | ---------------------------------------------------- |
| `/login`  | Admin sign-in (non-ADMIN logins rejected in the UI)  |

### Dashboard (`(dashboard)` route group — ADMIN-gated via `ProtectedRoute`)

| Route               | Description                                   |
| ------------------- | --------------------------------------------- |
| `/dashboard`        | Analytics overview (stats, charts, revenue)   |
| `/users`            | Users list (filter, paginate)                 |
| `/users/new`        | Create a user                                 |
| `/users/[id]`       | User detail                                   |
| `/providers`        | Providers list                                |
| `/providers/[id]`   | Provider detail (verification, availability)  |
| `/categories`       | Service categories list                       |
| `/categories/new`   | Create a category                             |
| `/categories/[id]`  | Category detail / edit                        |
| `/services`         | Services list                                 |
| `/services/new`     | Create a service                              |
| `/services/[id]`    | Service detail / edit                         |
| `/bookings`         | Bookings list                                 |
| `/bookings/[id]`    | Booking detail (status transitions, assign)   |
| `/payments`         | Payments list                                 |
| `/settings`         | Admin profile & settings                      |

## Project structure

```
src/
  app/                 App Router routes
    (auth)/            Unauthenticated route group + layout
    (dashboard)/       ADMIN-gated route group + AppShell layout
  components/
    auth/              AuthProvider, ProtectedRoute, LoginForm
    data/              Loading / empty / error states, stat cards, charts
    domain/            Status badges, money/date text, editors
    forms/             Form primitives (react-hook-form + zod)
    layout/            AppShell, Sidebar, Topbar, UserMenu
    ui/                Design-system primitives
  lib/
    api/               axios client + per-resource API modules
    auth/              token store + useAuth
    hooks/             React Query hooks per resource
    react-query/       QueryClient, key factory, Providers
    format/            money & date formatters
    validation/        shared zod schemas
  types/               API DTO types (snake_case, matching the contract)
```
