'use client';

// src/components/forms/FormError.tsx (04 §9, §7.4) — inline field error text and a
// form-level summary banner (for unmatched server errors / root errors).
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FieldErrorTextProps {
  message?: string;
  id?: string;
  className?: string;
}

/** Inline single-field error message (pairs with FormField). */
export function FieldErrorText({ message, id, className }: FieldErrorTextProps) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={cn('text-xs font-medium text-red-600', className)}>
      {message}
    </p>
  );
}

export interface FormErrorProps {
  message?: string | null;
  className?: string;
}

/** Form-level error summary banner (e.g. 401 form-level login error). */
export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
