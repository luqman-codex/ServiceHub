// src/components/data/LoadingState.tsx (04 §7.1, §7.4) — the "loading" UI state.
// Renders skeleton variants (table rows, cards, lines) or a centered spinner.
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';

export type LoadingVariant = 'spinner' | 'table' | 'cards' | 'lines';

export interface LoadingStateProps {
  variant?: LoadingVariant;
  /** Number of skeleton rows/cards/lines to render. */
  rows?: number;
  /** Columns for the table variant. */
  columns?: number;
  label?: string;
  className?: string;
}

export function LoadingState({
  variant = 'spinner',
  rows = 5,
  columns = 4,
  label = 'Loading…',
  className,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn('flex items-center justify-center gap-2 py-12 text-slate-500', className)}
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">{label}</span>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}
      >
        <div className="flex gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-4 px-4 py-4">
              {Array.from({ length: columns }).map((_, c) => (
                <Skeleton key={c} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-6">
            <Skeleton className="mb-3 h-4 w-1/2" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" aria-label={label} className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
