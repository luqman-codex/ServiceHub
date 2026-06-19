'use client';

// src/components/data/ErrorState.tsx (04 §7.1, §7.4, §5) — the "error" UI state:
// normalized message (from ApiError) + a Retry action.
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils/cn';

export interface ErrorStateProps {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

function messageFromError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function ErrorState({ error, title = 'Unable to load', onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{messageFromError(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
