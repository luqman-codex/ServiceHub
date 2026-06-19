'use client';

// src/components/forms/FormField.tsx (04 §9, §7.4) — label above input + inline error.
// Reads the field error from RHF context by `name`; wires aria-describedby + ids.
import { useFormContext, get } from 'react-hook-form';
import { useId } from 'react';
import { FieldErrorText } from './FormError';
import { cn } from '@/lib/utils/cn';

export interface FormFieldProps {
  /** RHF field name; used to look up the error in form state. */
  name: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  /**
   * Render the control. Receives wiring props to spread onto your input
   * (`id`, `aria-invalid`, `aria-describedby`) plus a derived `invalid` flag.
   */
  children: (props: {
    id: string;
    invalid: boolean;
    'aria-invalid': boolean | undefined;
    'aria-describedby': string | undefined;
  }) => React.ReactNode;
}

export function FormField({ name, label, hint, required, className, children }: FormFieldProps) {
  const {
    formState: { errors },
  } = useFormContext();
  const fieldError = get(errors, name);
  const message = typeof fieldError?.message === 'string' ? fieldError.message : undefined;

  const reactId = useId();
  const fieldId = `${reactId}-${name}`;
  const errorId = message ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  const invalid = Boolean(message);

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children({
        id: fieldId,
        invalid,
        'aria-invalid': invalid || undefined,
        'aria-describedby': describedBy,
      })}
      {hint && !message && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      <FieldErrorText id={errorId} message={message} />
    </div>
  );
}
