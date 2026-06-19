'use client';

// src/components/auth/LoginForm.tsx (04 §B.2.3, §9) — CUSTOMER login form.
// RHF + zod; calls useAuth().login. UNLIKE the admin panel, the site does NOT role-gate
// the login itself — any active account is accepted (account/* routes enforce CUSTOMER
// via <ProtectedRoute>). Maps 422 details onto fields and 401/403/429 onto a form-level
// message. On success, redirects to ?redirect= (same-origin) or '/'.
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormError } from '@/components/forms/FormError';
import { FormActions } from '@/components/forms/FormActions';
import { Input } from '@/components/ui/Input';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { login as loginRequest } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/useAuth';
import { ApiError } from '@/lib/api/errors';
import { emailSchema } from '@/lib/validation/common';
import type { AuthResultDTO } from '@/types/api';

// Mirrors 02 §8.1 login validation (04 §9): email valid, password non-empty.
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation<AuthResultDTO, ApiError, LoginValues>({
    mutationFn: (values) => loginRequest(values),
    onSuccess: (result) => {
      // Site accepts any active role (no admin-style role rejection at the UI layer).
      login(result.access_token, result.user);
      toast.success('Welcome back');
      const redirect = searchParams.get('redirect');
      router.replace(redirect && redirect.startsWith('/') ? redirect : '/');
    },
    onError: (err) => {
      if (err.code === 'VALIDATION_ERROR' && err.details?.length) {
        err.details.forEach((d) =>
          form.setError(d.field as keyof LoginValues, { message: d.message }),
        );
        return;
      }
      if (err.status === 401 || err.code === 'INVALID_CREDENTIALS') {
        setFormError('Invalid email or password.');
      } else if (err.status === 403 || err.code === 'ACCOUNT_INACTIVE') {
        setFormError('This account is deactivated.');
      } else if (err.status === 429 || err.code === 'RATE_LIMITED') {
        setFormError('Too many attempts, try again shortly.');
      } else {
        setFormError(err.message);
      }
    },
  });

  const onSubmit = (values: LoginValues) => {
    setFormError(null);
    mutation.mutate(values);
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormError message={formError} />

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

      <FormField name="password" label="Password" required>
        {(p) => (
          <PasswordField
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={p.invalid}
            id={p.id}
            aria-invalid={p['aria-invalid']}
            aria-describedby={p['aria-describedby']}
            {...form.register('password')}
          />
        )}
      </FormField>

      <FormActions className="border-0 pt-0">
        <Button type="submit" fullWidth isLoading={mutation.isPending} leftIcon={<LogIn className="h-4 w-4" />}>
          Sign in
        </Button>
      </FormActions>
    </Form>
  );
}
