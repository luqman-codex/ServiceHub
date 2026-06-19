// src/lib/react-query/keys.ts (04 §4.2) — hierarchical query-key factory.
// Lists carry their serialized filters so distinct filter sets cache independently;
// invalidating the base key refetches all variants.
export const qk = {
  auth: { me: () => ['auth', 'me'] as const },
  profile: {
    detail: () => ['profile'] as const,
    provider: (userId?: number) => ['providerProfile', userId ?? 'self'] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (f: Record<string, unknown>) => ['users', 'list', f] as const,
    detail: (id: number) => ['users', id] as const,
  },
  categories: {
    all: () => ['categories'] as const,
    list: (f: Record<string, unknown>) => ['categories', 'list', f] as const,
    detail: (id: number) => ['categories', id] as const,
  },
  services: {
    all: () => ['services'] as const,
    list: (f: Record<string, unknown>) => ['services', 'list', f] as const,
    detail: (id: number) => ['services', id] as const,
  },
  bookings: {
    all: () => ['bookings'] as const,
    list: (f: Record<string, unknown>) => ['bookings', 'list', f] as const,
    detail: (id: number) => ['bookings', id] as const,
    payment: (id: number) => ['bookings', id, 'payment'] as const,
  },
  availability: {
    byProvider: (pid: number) => ['providerAvailability', pid] as const,
  },
  payments: {
    list: (f: Record<string, unknown>) => ['payments', 'list', f] as const,
  },
  notifications: {
    list: (f: Record<string, unknown>) => ['notifications', 'list', f] as const,
  },
  admin: {
    stats: () => ['admin', 'stats'] as const,
    statsBookings: (f: Record<string, unknown>) => ['admin', 'stats', 'bookings', f] as const,
  },
};
