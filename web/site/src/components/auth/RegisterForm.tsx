'use client';

// src/components/auth/RegisterForm.tsx (04 §B.2.2 C-1, §9) — self-service signup.
// POST /auth/register ALWAYS creates a CUSTOMER (02 §8.1) and returns an AuthResultDTO,
// so we auto-login on success. RHF + zod mirror 02 §12 field rules; server stays the
// source of truth on 422. 409 EMAIL_ALREADY_EXISTS maps to the email field; other
// validation details map per-field. Redirects to ?redirect= (same-origin) or '/'.
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormError } from '@/components/forms/FormError';
import { FormActions } from '@/components/forms/FormActions';
import { Input } from '@/components/ui/Input';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { register as registerRequest, type RegisterRequest } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/useAuth';
import { ApiError } from '@/lib/api/errors';
import { emailSchema, nameSchema, passwordSchema, phoneSchema } from '@/lib/validation/common';
import type { AuthResultDTO } from '@/types/api';

// Mirrors 02 §8.1 / §12 register validation (04 §9, §B.2.2).
const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', phone: '' },
  });

  const mutation = useMutation<AuthResultDTO, ApiError, RegisterValues>({
    mutationFn: (values) => {
      // Drop the empty-string phone before sending (optional field, 02 §6).
      const body: RegisterRequest = {
        name: values.name,
        email: values.email,
        password: values.password,
        ...(values.phone ? { phone: values.phone } : {}),
      };
      return registerRequest(body);
    },
    onSuccess: (result) => {
      login(result.access_token, result.user);
      toast.success('Welcome to ServiceHub');
      const redirect = searchParams.get('redirect');
      router.replace(redirect && redirect.startsWith('/') ? redirect : '/');
    },
    onError: (err) => {
      if (err.code === 'VALIDATION_ERROR' && err.details?.length) {
        err.details.forEach((d) =>
          form.setError(d.field as keyof RegisterValues, { message: d.message }),
        );
        return;
      }
      if (err.status === 409 || err.code === 'EMAIL_ALREADY_EXISTS') {
        form.setError('email', { message: 'This email is already in use' });
        return;
      }
      if (err.status === 429 || err.code === 'RATE_LIMITED') {
        setFormError('Too many attempts, try again shortly.');
      } else {
        setFormError(err.message);
      }
    },
  });

  const onSubmit = (values: RegisterValues) => {
    setFormError(null);
    mutation.mutate(values);
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormError message={formError} />

      <FormField name="name" label="Full name" required>
        {(p) => (
          <Input
            autoComplete="name"
            placeholder="Jane Doe"
            invalid={p.invalid}
            id={p.id}
            aria-invalid={p['aria-invalid']}
            aria-describedby={p['aria-describedby']}
            {...form.register('name')}
          />
        )}
      </FormField>

      <FormField name="email" label="Email" required>
        {(p) => (
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={p.invalid}
            id={p.id}
            aria-invalid={p['aria-invalid']}
            aria-describedby={p['aria-describedby']}
            {...form.register('email')}
          />
        )}
      </FormField>

      <FormField
        name="password"
        label="Password"
        required
        hint="At least 8 characters, with a letter and a number."
      >
        {(p) => (
          <PasswordField
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={p.invalid}
            id={p.id}
            aria-invalid={p['aria-invalid']}
            aria-describedby={p['aria-describedby']}
            {...form.register('password')}
          />
        )}
      </FormField>

      <FormField name="phone" label="Phone" hint="Optional">
        {(p) => (
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            invalid={p.invalid}
            id={p.id}
            aria-invalid={p['aria-invalid']}
            aria-describedby={p['aria-describedby']}
            {...form.register('phone')}
          />
        )}
      </FormField>

      <FormActions className="border-0 pt-0">
        <Button
          type="submit"
          fullWidth
          isLoading={mutation.isPending}
          leftIcon={<UserPlus className="h-4 w-4" />}
        >
          Create account
        </Button>
      </FormActions>
    </Form>
  );
}
