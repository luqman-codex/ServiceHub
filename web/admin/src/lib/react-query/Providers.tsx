'use client';

// src/lib/react-query/Providers.tsx (04 §4.1)
// Single "use client" wrapper mounted in the root layout: QueryClientProvider (created
// once per browser session) + AuthProvider + ReactQueryDevtools (dev) + Toaster.
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { makeQueryClient } from './query-client';
import { AuthProvider } from '@/components/auth/AuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
