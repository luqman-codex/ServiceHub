'use client';

// src/app/(dashboard)/profile/page.tsx (P-9) — the signed-in PROVIDER's profile + account.
// Three tabbed sections:
//   • Account   — GET /profile, PATCH /profile ({ name?, phone? }); email read-only.
//   • Password  — PATCH /profile/password ({ current_password, new_password }).
//   • Provider  — GET /profile/provider, PUT /profile/provider ({ bio, skills, service_area });
//                 is_verified + rating shown read-only.
// Every section renders loading / empty / error / success. Forms use RHF + zod and map
// 422 ApiError.details onto fields via applyServerErrors; 401 INVALID_CREDENTIALS on the
// password form surfaces on current_password.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Save,
  KeyRound,
  UserCog,
  BadgeCheck,
  ShieldOff,
  Star,
  Loader2,
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/Textarea';
import { PasswordField } from '@/components/ui/PasswordField';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { DateTimeText } from '@/components/domain/DateTimeText';
import {
  nameSchema,
  phoneSchema,
  passwordSchema,
  applyServerErrors,
} from '@/lib/validation/common';
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useProviderProfile,
  useUpsertProviderProfile,
} from '@/lib/hooks/useProfile';
import { ApiError } from '@/lib/api/errors';
import type { ProviderProfileDTO, UserDTO } from '@/types/api';

// --- Account form (name + phone; email immutable) ---------------------------

const accountSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});
type AccountValues = z.infer<typeof accountSchema>;

function AccountForm({ user }: { user: UserDTO }) {
  const updateProfile = useUpdateProfile();

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: user.name, phone: user.phone ?? '' },
  });

  // Re-sync if the cached profile changes underneath the form.
  useEffect(() => {
    form.reset({ name: user.name, phone: user.phone ?? '' });
  }, [user.name, user.phone, form]);

  const onSubmit = (values: AccountValues) => {
    const phone = values.phone?.trim() ? values.phone.trim() : null;
    updateProfile.mutate(
      { name: values.name.trim(), phone },
      {
        onSuccess: () => toast.success('Profile updated'),
        onError: (err) =>
          applyServerErrors(
            err,
            (field, e) => form.setError(field as keyof AccountValues, e),
            (m) => toast.error(m),
          ),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Update your name and phone number.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <FormField name="name" label="Name" required>
            {(p) => (
              <Input
                autoComplete="name"
                placeholder="Pat Provider"
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('name')}
              />
            )}
          </FormField>

          <FormField
            name="email"
            label="Email"
            hint="Email is managed by an administrator and cannot be changed here."
          >
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

// --- Change-password form ----------------------------------------------------

const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
  })
  .refine((v) => v.current_password !== v.new_password, {
    message: 'New password must differ from the current one',
    path: ['new_password'],
  });
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

function ChangePasswordForm() {
  const changePassword = useChangePassword();

  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { current_password: '', new_password: '' },
  });

  const onSubmit = (values: PasswordChangeValues) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        toast.success('Password updated');
        form.reset({ current_password: '', new_password: '' });
      },
      onError: (err) => {
        // 401 INVALID_CREDENTIALS → wrong current password (02 §8.2).
        if (err.status === 401 || err.code === 'INVALID_CREDENTIALS') {
          form.setError('current_password', {
            message: 'Current password is incorrect',
          });
          return;
        }
        applyServerErrors(
          err,
          (field, e) => form.setError(field as keyof PasswordChangeValues, e),
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

// --- Provider profile form (bio / skills / service_area) ---------------------
// is_verified + rating are read-only display (server / ADMIN managed).

const providerProfileSchema = z.object({
  bio: z.string().max(2000, 'must be at most 2000 characters').or(z.literal('')),
  skills: z.string().max(500, 'must be at most 500 characters').or(z.literal('')),
  service_area: z
    .string()
    .max(255, 'must be at most 255 characters')
    .or(z.literal('')),
});
type ProviderProfileValues = z.infer<typeof providerProfileSchema>;

function emptyToNull(v: string): string | null {
  const t = v.trim();
  return t ? t : null;
}

function ProviderProfileForm({
  profile,
}: {
  profile: ProviderProfileDTO | null;
}) {
  const upsert = useUpsertProviderProfile();

  const form = useForm<ProviderProfileValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      bio: profile?.bio ?? '',
      skills: profile?.skills ?? '',
      service_area: profile?.service_area ?? '',
    },
  });

  // Re-sync when the cached provider profile changes (e.g. first create).
  useEffect(() => {
    form.reset({
      bio: profile?.bio ?? '',
      skills: profile?.skills ?? '',
      service_area: profile?.service_area ?? '',
    });
  }, [profile?.bio, profile?.skills, profile?.service_area, form]);

  const onSubmit = (values: ProviderProfileValues) => {
    upsert.mutate(
      {
        bio: emptyToNull(values.bio),
        skills: emptyToNull(values.skills),
        service_area: emptyToNull(values.service_area),
      },
      {
        onSuccess: () =>
          toast.success(
            profile ? 'Provider profile updated' : 'Provider profile created',
          ),
        onError: (err) =>
          applyServerErrors(
            err,
            (field, e) =>
              form.setError(field as keyof ProviderProfileValues, e),
            (m) => toast.error(m),
          ),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider profile</CardTitle>
        <CardDescription>
          Tell customers about your work. Skills are a comma-separated list.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Read-only verification + rating display */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          {profile?.is_verified ? (
            <Badge color="green">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Verified provider
            </Badge>
          ) : (
            <Badge color="slate">
              <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
              Not verified
            </Badge>
          )}
          <Badge color="amber">
            <Star className="h-3.5 w-3.5" aria-hidden="true" />
            Rating {profile ? profile.rating : '—'}
          </Badge>
          <span className="ml-auto text-xs text-slate-500">
            {profile ? (
              <>
                Updated <DateTimeText value={profile.updated_at} format="datetime" />
              </>
            ) : (
              'No provider profile yet — fill out the form to create one.'
            )}
          </span>
        </div>

        <Form form={form} onSubmit={onSubmit}>
          <FormField name="bio" label="Bio">
            {(p) => (
              <Textarea
                rows={4}
                placeholder="Describe your experience and the services you offer."
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('bio')}
              />
            )}
          </FormField>

          <FormField
            name="skills"
            label="Skills"
            hint="Comma-separated, e.g. Plumbing, Electrical, Carpentry."
          >
            {(p) => (
              <Input
                placeholder="Plumbing, Electrical, Carpentry"
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('skills')}
              />
            )}
          </FormField>

          <FormField name="service_area" label="Service area">
            {(p) => (
              <Input
                placeholder="Downtown, North Side"
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('service_area')}
              />
            )}
          </FormField>

          <FormActions>
            <Button
              type="submit"
              isLoading={upsert.isPending}
              leftIcon={<Save className="h-4 w-4" />}
            >
              {profile ? 'Save provider profile' : 'Create provider profile'}
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
}

// Wraps the provider-profile query: handles loading / 404-empty / error / success.
function ProviderProfileSection() {
  const { data, isLoading, isError, error, refetch } = useProviderProfile();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading provider profile…
      </div>
    );
  }

  // A 404 means "no provider profile yet" — a valid empty state, not an error.
  const isNotFound =
    error instanceof ApiError &&
    (error.status === 404 || error.code === 'NOT_FOUND');

  if (isError && !isNotFound) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return <ProviderProfileForm profile={data ?? null} />;
}

// --- Screen ------------------------------------------------------------------

type ProfileTab = 'account' | 'password' | 'provider';

function ProfileScreen() {
  const { data: user, isLoading, isError, error, refetch } = useProfile();
  const [tab, setTab] = useState<ProfileTab>('account');

  if (isLoading) {
    return <LoadingState variant="lines" rows={6} className="max-w-3xl" />;
  }
  if (isError || !user) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="max-w-3xl">
      {/* Controlled Tabs: the panel content swaps to the active section's form. */}
      <Tabs
        items={[
          { value: 'account', label: 'Account' },
          { value: 'password', label: 'Password' },
          { value: 'provider', label: 'Provider profile' },
        ]}
        value={tab}
        onValueChange={(v) => setTab(v as ProfileTab)}
      >
        {tab === 'account' && <AccountForm user={user} />}
        {tab === 'password' && <ChangePasswordForm />}
        {tab === 'provider' && <ProviderProfileSection />}
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredRole="PROVIDER">
      <AppShell
        title={
          <span className="inline-flex items-center gap-2">
            <UserCog className="h-5 w-5 text-slate-400" aria-hidden="true" />
            Profile
          </span>
        }
      >
        <ProfileScreen />
      </AppShell>
    </ProtectedRoute>
  );
}
