'use client';

// src/components/ui/Input.tsx (04 §7.1) — text input primitive.
// Visual error state via `invalid`; pairs with FormField for label + error text.
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, leftIcon, rightIcon, className, type = 'text', ...rest },
  ref,
) {
  const field = (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        invalid
          ? 'border-red-400 focus-visible:ring-red-500'
          : 'border-slate-300 focus-visible:ring-brand',
        leftIcon && 'pl-9',
        rightIcon && 'pr-9',
        className,
      )}
      {...rest}
    />
  );

  if (!leftIcon && !rightIcon) return field;

  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {leftIcon}
        </span>
      )}
      {field}
      {rightIcon && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{rightIcon}</span>
      )}
    </div>
  );
});
