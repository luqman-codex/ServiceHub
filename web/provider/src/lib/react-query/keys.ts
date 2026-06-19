// src/lib/react-query/keys.ts (04 §4.2) — hierarchical query-key factory.
// Lists carry their serialized filters so distinct filter sets cache independently;
// invalidating the base key refetches all variants.
export const qk = {
  auth: { me: () => ['auth', 'me'] as const },
  profile: {
    detail: () => ['profile'] as const,
    provider: () => ['providerProfile', 'self'] as const,
  },
  bookings: {
    all: () => ['bookings'] as const,
    list: (f: Record<string, unknown>) => ['bookings', 'list', f] as const,
    detail: (id: number) => ['bookings', id] as const,
  },
  availability: {
    all: () => ['providerAvailability'] as const,
    list: (f: Record<string, unknown>) => ['providerAvailability', 'list', f] as const,
  },
};
