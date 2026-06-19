'use client';

// src/components/forms/Form.tsx (04 §7.1, §9) — RHF context wrapper. Pass a
// useForm() instance and an onSubmit handler; children read context via useFormContext().
import { FormProvider, type FieldValues, type UseFormReturn, type SubmitHandler } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';

export interface FormProps<TValues extends FieldValues>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  form: UseFormReturn<TValues>;
  onSubmit: SubmitHandler<TValues>;
}

export function Form<TValues extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
  ...rest
}: FormProps<TValues>) {
  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-5', className)}
        {...rest}
      >
        {children}
      </form>
    </FormProvider>
  );
}
