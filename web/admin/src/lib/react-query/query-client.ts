// src/lib/react-query/query-client.ts (04 §4.1)
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/errors';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s: catalog/list data tolerably fresh
        gcTime: 5 * 60_000, // 5 min cache retention
        refetchOnWindowFocus: true, // dashboards/booking tracking stay current
        retry: (failureCount, error) => {
          const status = (error as ApiError)?.status;
          if (status && status >= 400 && status < 500) return false; // never retry 4xx
          return failureCount < 2; // retry transient 5xx/network up to 2x
        },
      },
      mutations: { retry: 0 }, // mutations never auto-retry (avoid double writes)
    },
  });
}
