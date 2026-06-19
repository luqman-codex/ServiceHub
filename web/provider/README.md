# ServiceHub — Provider Portal

The **Provider Portal** is the job-management web app for ServiceHub **service providers**.
Providers sign in to see only their own assigned work and account data: review and accept/reject
incoming jobs, start and complete accepted jobs, manage their weekly availability, and maintain
their account + provider profile.

A provider only ever sees **their own data** — the API scopes every list and detail response by
the authenticated provider's role, so there are no admin-only screens or endpoints here.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **@tanstack/react-query v5** — server state, caching, invalidation
- **axios** — HTTP client with auth-token + error-envelope interceptors
- **react-hook-form** + **zod** — typed forms and validation (with 422 field mapping)
- **Tailwind CSS** — styling
- **lucide-react** — icons
- **sonner** — toasts
- **date-fns** — date formatting

## Prerequisites

The ServiceHub backend API must be running and reachable at **http://localhost:4000/api/v1**.
CORS on the backend already allows the provider portal origin (**http://localhost:3002**).

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Environment — copy the example and adjust if needed
cp .env.example .env.local
```

`.env.local` variables:

| Variable                    | Value                              | Purpose                                  |
| --------------------------- | ---------------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  | `http://localhost:4000/api/v1`     | Backend API base URL                     |
| `NEXT_PUBLIC_TOKEN_KEY`     | `servicehub.provider.token`        | localStorage key for the provider's JWT  |

```bash
# 3. Run the dev server (http://localhost:3002)
npm run dev
```

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build on :3002
npm run lint    # eslint
```

## Sample login

The portal accepts **PROVIDER** accounts only — non-provider accounts are rejected at sign-in
with "This portal is for service providers only."

```
Email:    provider1@servicehub.test
Password: Provider@12345
```

## Routes

| Route               | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `/login`            | Provider sign-in (rejects non-PROVIDER accounts).                           |
| `/dashboard`        | Overview: job counts by status, today's jobs, upcoming jobs.                |
| `/jobs`             | The provider's assigned jobs — filter by status, sort, paginate.            |
| `/jobs/[id]`        | Job detail with service/customer/payment, status timeline, and actions.    |
| `/availability`     | Manage weekly availability windows (day, start/end time, availability flag).|
| `/profile`          | Account (name/phone, password) + provider profile (bio, skills, service area).|

### Job lifecycle actions

The booking status gates which action a provider can take:

- `PENDING` → **Accept** / **Reject** (reason required)
- `ACCEPTED` → **Start**
- `IN_PROGRESS` → **Complete**
- `REJECTED` / `COMPLETED` / `CANCELLED` → terminal (no actions)
