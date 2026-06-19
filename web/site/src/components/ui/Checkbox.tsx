'use client';

// src/components/ui/Checkbox.tsx (04 §7.1) — styled native checkbox primitive.
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  invalid?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { invalid = false, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-invalid={invalid || undefined}
      className={cn(
        'h-4 w-4 rounded border-slate-300 text-brand',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        invalid && 'border-red-400',
        className,
      )}
      {...rest}
    />
  );
});
