'use client';

// src/app/(dashboard)/settings/page.tsx (04 §A.2.12) — the signed-in admin's own profile.
// Edit name/phone (email shown read-only) and change password.
// GET /profile, PATCH /profile ({ name?, phone? }), PATCH /profile/password
//   ({ current_password, new_password }).
// 422 → per-field errors via applyServerErrors; 401 INVALID_CREDENTIALS → field
// error on current_password. Success invalidates ['profile'] + ['auth','me'].
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Save, KeyRound, Settings as SettingsIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { nameSchema, phoneSchema, passwordSchema, applyServerErrors } from '@/lib/validation/common';
import { useProfile, useUpdateProfile, useChangePassword } from '@/lib/hooks/useProfile';
import type { UserDTO } from '@/types/api';

// --- Profile form (name + phone; email immutable) ---
const profileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});
type ProfileValues = z.infer<typeof profileSchema>;

function ProfileForm({ user }: { user: UserDTO }) {
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone ?? '' },
  });

  // Re-sync defaults if the cached profile changes underneath the form.
  useEffect(() => {
    form.reset({ name: user.name, phone: user.phone ?? '' });
  }, [user.name, user.phone, form]);

  const onSubmit = (values: ProfileValues) => {
    const phone = values.phone?.trim() ? values.phone.trim() : null;
    updateProfile.mutate(
      { name: values.name.trim(), phone },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: (err) =>
          applyServerErrors(
            err,
            (field, e) => form.setError(field as keyof ProfileValues, e),
            (m) => toast.error(m),
          ),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your name and phone number.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <FormField name="name" label="Name" required>
            {(p) => (
              <Input
                autoComplete="name"
                placeholder="Jane Admin"
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('name')}
              />
            )}
          </FormField>

          <FormField name="email" label="Email" hint="Email is managed by an administrator and cannot be changed here.">
            {(p) => (
              <Input
                type="email"
                value={user.email}
                disabled
                readOnly
                id={p.id}
                aria-describedby={p['aria-describedby']}
              />
            )}
          </FormField>

          <FormField name="phone" label="Phone">
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

          <FormActions>
            <Button
              type="submit"
              isLoading={updateProfile.isPending}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save changes
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
}

// --- Change-password form ---
const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
  })
  .refine((v) => v.current_password !== v.new_password, {
    message: 'New password must differ from the current one',
    path: ['new_password'],
  });
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordForm() {
  const changePassword = useChangePassword();

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '' },
  });

  const onSubmit = (values: ChangePasswordValues) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        toast.success('Password updated');
        form.reset({ current_password: '', new_password: '' });
      },
      onError: (err) => {
        // 401 INVALID_CREDENTIALS → wrong current password (§A.2.12).
        if (err.status === 401 || err.code === 'INVALID_CREDENTIALS') {
          form.setError('current_password', { message: 'Current password is incorrect' });
          return;
        }
        applyServerErrors(
          err,
          (field, e) => form.setError(field as keyof ChangePasswordValues, e),
          (m) => toast.error(m),
        );
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Use at least 8 characters with one letter and one digit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <FormField name="current_password" label="Current password" required>
            {(p) => (
              <PasswordField
                autoComplete="current-password"
                placeholder="••••••••"
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('current_password')}
              />
            )}
          </FormField>

          <FormField name="new_password" label="New password" required>
            {(p) => (
              <PasswordField
                autoComplete="new-password"
                placeholder="••••••••"
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('new_password')}
              />
            )}
          </FormField>

          <FormActions>
            <Button
              type="submit"
              isLoading={changePassword.isPending}
              leftIcon={<KeyRound className="h-4 w-4" />}
            >
              Update password
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
}

function SettingsScreen() {
  const { data: user, isLoading, isError, error, refetch } = useProfile();

  if (isLoading) {
    return <LoadingState variant="lines" rows={6} className="max-w-3xl" />;
  }
  if (isError || !user) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-6">
      <ProfileForm user={user} />
      <ChangePasswordForm />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell
        title={
          <span className="inline-flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            Settings
          </span>
        }
      >
        <SettingsScreen />
      </AppShell>
    </ProtectedRoute>
  );
}
