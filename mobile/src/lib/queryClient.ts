// src/lib/queryClient.ts (05 §8.3)
// Shared React Query client. Sensible defaults for a mobile session.
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // 30s: catalog data rarely changes mid-session
      refetchOnWindowFocus: false, // irrelevant on RN; explicit for clarity
    },
    mutations: { retry: 0 },
  },
});
