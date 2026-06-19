'use client';

// src/app/(dashboard)/users/new/page.tsx (04 §A.2.4) — Create User (A-3).
// Admin creates a user with ANY role (the only path to PROVIDER/ADMIN).
// RHF + zod; maps 409 EMAIL_ALREADY_EXISTS → email field, 422 → per-field details.
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordField } from '@/components/ui/PasswordField';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  phoneSchema,
  roleEnum,
  applyServerErrors,
} from '@/lib/validation/common';
import { useCreateUser } from '@/lib/hooks/useUsers';

// Mirrors AdminCreateUserRequest validation (02 §8.3).
const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleEnum,
  phone: phoneSchema,
  is_active: z.boolean(),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

function CreateUserInner() {
  const router = useRouter();
  const mutation = useCreateUser();

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'CUSTOMER',
      phone: '',
      is_active: true,
    },
  });

  const onSubmit = (values: CreateUserValues) => {
    mutation.mutate(
      {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        phone: values.phone ? values.phone : undefined,
        is_active: values.is_active,
      },
      {
        onSuccess: (user) => {
          toast.success('User created');
          router.push(`/users/${user.id}`);
        },
        onError: (err) => applyServerErrors(err, (field, e) => form.setError(field as never, e), (m) => toast.error(m)),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => router.push('/users')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </button>

      <Card>
        <CardHeader>
          <CardTitle>New user</CardTitle>
        </CardHeader>
        <CardContent>
          <Form form={form} onSubmit={onSubmit}>
            <FormField name="name" label="Name" required>
              {(p) => (
                <Input
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  placeholder="Jane Doe"
                  {...form.register('name')}
                />
              )}
            </FormField>

            <FormField name="email" label="Email" required>
              {(p) => (
                <Input
                  type="email"
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  placeholder="jane@example.com"
                  {...form.register('email')}
                />
              )}
            </FormField>

            <FormField name="password" label="Password" required hint="8–72 chars, at least one letter and one digit.">
              {(p) => (
                <PasswordField
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  placeholder="••••••••"
                  {...form.register('password')}
                />
              )}
            </FormField>

            <FormField name="role" label="Role" required>
              {(p) => (
                <Select
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  options={[
                    { value: 'CUSTOMER', label: 'Customer' },
                    { value: 'PROVIDER', label: 'Provider' },
                    { value: 'ADMIN', label: 'Admin' },
                  ]}
                  {...form.register('role')}
                />
              )}
            </FormField>

            <FormField name="phone" label="Phone" hint="Optional.">
              {(p) => (
                <Input
                  type="tel"
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  placeholder="+1 555 123 4567"
                  {...form.register('phone')}
                />
              )}
            </FormField>

            <FormField name="is_active" label="Active">
              {(p) => (
                <div className="flex items-center gap-3">
                  <Switch
                    id={p.id}
                    checked={form.watch('is_active')}
                    onCheckedChange={(c) => form.setValue('is_active', c)}
                    aria-label="Active"
                  />
                  <span className="text-sm text-slate-600">
                    {form.watch('is_active') ? 'Can sign in' : 'Sign-in disabled'}
                  </span>
                </div>
              )}
            </FormField>

            <FormActions>
              <Button type="button" variant="outline" onClick={() => router.push('/users')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={mutation.isPending} leftIcon={<UserPlus className="h-4 w-4" />}>
                Create user
              </Button>
            </FormActions>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewUserPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell title="New user">
        <CreateUserInner />
      </AppShell>
    </ProtectedRoute>
  );
}
