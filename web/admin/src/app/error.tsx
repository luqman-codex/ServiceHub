'use client';

// src/app/error.tsx (04 §A.1) — root segment error boundary.
// Next.js renders this Client Component when an error is thrown while rendering a
// route segment below the root layout. It receives the error + a reset() callback
// that re-renders the segment (our "Retry"). We surface the normalized ApiError
// message via the shared ErrorState component for consistency with data screens.
import { useEffect } from 'react';
import { ErrorState } from '@/components/data';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console for debugging; production telemetry would hook in here.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <ErrorState
        className="w-full max-w-md"
        title="Something went wrong"
        error={error}
        onRetry={reset}
      />
    </div>
  );
}
