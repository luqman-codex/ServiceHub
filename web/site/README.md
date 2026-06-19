# ServiceHub — Customer Website

The customer-facing website for ServiceHub. It lets customers browse the public
service catalog, view service and category detail, book a service, pay for a
booking, and manage their account (profile, bookings, notifications).

This web app is a 1:1 mirror of the ServiceHub React Native customer app. Every
screen here corresponds to a screen in the mobile app — see the
**user-website ↔ React Native mirror table in §B.10** of
`planning/04-WEB-PRD.md` for the exact mapping.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **@tanstack/react-query v5** — server state, key factory + invalidation matrix
- **axios** — API client with a shared error envelope + auth interceptor
- **react-hook-form** + **zod** (`@hookform/resolvers`) — forms & validation
- **Tailwind CSS 3** — styling + design tokens
- **lucide-react** — icons
- **sonner** — toasts
- **date-fns** — date formatting

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create the local env file (see below) at web/site/.env.local

# 3. Start the dev server (runs on http://localhost:3001)
npm run dev
```

### Environment (`.env.local`)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_TOKEN_KEY=servicehub.site.token
```

### Backend requirement

The API must be running at **http://localhost:4000/api/v1** for any data screen
to work. Start the backend first, then `npm run dev` here.

### Sample customer login

```
email:    customer1@servicehub.test
password: Customer@12345
```

## Scripts

| Command         | Description                                    |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Dev server on port **3001**                    |
| `npm run build` | Production build (the CI gate)                 |
| `npm start`     | Serve the production build on port **3001**    |
| `npm run lint`  | ESLint                                         |

## Routes

Public (no auth required):

| Route                  | Screen                                      |
| ---------------------- | ------------------------------------------- |
| `/`                    | Home — featured services + categories       |
| `/services`            | Browse services (search, filter, paginate)  |
| `/services/[id]`       | Service detail + "Book this service" CTA    |
| `/categories`          | Browse categories                           |
| `/login`               | Sign in                                     |
| `/register`            | Create a customer account                   |

Authenticated (CUSTOMER role — gated by `ProtectedRoute`):

| Route                  | Screen                                      |
| ---------------------- | ------------------------------------------- |
| `/book/[serviceId]`    | Booking form (+ optional pay-now)           |
| `/account`             | Profile + change password                   |
| `/bookings`            | My bookings (list)                          |
| `/bookings/[id]`       | Booking detail + status timeline + payment  |
| `/notifications`       | Notifications (mark read / delete)          |

Guests hitting an authenticated route are redirected to
`/login?redirect=<path>`; a logged-in non-customer (provider/admin) is sent home.

## Architecture notes

- **Auth/token**: token persisted under `NEXT_PUBLIC_TOKEN_KEY`
  (`servicehub.site.token`). `AuthProvider` accepts any active session
  (typically CUSTOMER); guest browsing is a first-class state.
- **Layout**: a public `Header` + `NavBar` + `Footer` shell wraps every page
  (no admin sidebar). Account pages add an account sub-nav behind the gate.
- **Data layer** (React Query key factory, axios client, error envelope, UI
  primitives) is shared 1:1 with the admin app per `planning/04-WEB-PRD.md`
  §6 / §0.1.

## Mirror with the mobile app

For the authoritative per-screen mapping between this website and the
React Native customer app, see **§B.10 (the user-website ↔ React Native mirror
table)** in `planning/04-WEB-PRD.md`.
