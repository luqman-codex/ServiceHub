'use client';

// src/app/(dashboard)/users/[id]/page.tsx (04 §A.2.5) — User Detail (A-3).
// View one user; edit name/email/phone; toggle active (confirm); change role (confirm).
// If role === PROVIDER, embeds the provider profile panel + AvailabilityEditor.
// Self-guard: admin cannot deactivate/demote self (API → 409); UI disables those controls.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { RoleBadge } from '@/components/domain/RoleBadge';
import { ActiveBadge } from '@/components/domain/ActiveBadge';
import { VerifiedBadge } from '@/components/domain/VerifiedBadge';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { AvailabilityEditor } from '@/components/domain/AvailabilityEditor';
import {
  emailSchema,
  nameSchema,
  phoneSchema,
  roleEnum,
  applyServerErrors,
} from '@/lib/validation/common';
import { useAuth } from '@/lib/auth/useAuth';
import { ApiError } from '@/lib/api/errors';
import {
  useProviderProfile,
  useUpdateUser,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpsertProviderProfile,
  useUser,
} from '@/lib/hooks/useUsers';
import type { RoleName, UserDTO } from '@/types/api';

// --- Edit identity form (PATCH /users/:id) ---
const editUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
});
type EditUserValues = z.infer<typeof editUserSchema>;

// --- Provider profile form (PUT /profile/provider) ---
const providerProfileSchema = z.object({
  bio: z.string().max(2000, 'must be at most 2000 characters').optional().or(z.literal('')),
  skills: z.string().max(500, 'must be at most 500 characters').optional().or(z.literal('')),
  service_area: z.string().max(255, 'must be at most 255 characters').optional().or(z.literal('')),
  is_verified: z.boolean(),
});
type ProviderProfileValues = z.infer<typeof providerProfileSchema>;

function EditUserForm({ user }: { user: UserDTO }) {
  const updateMutation = useUpdateUser(user.id);

  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: user.name, email: user.email, phone: user.phone ?? '' },
  });

  // Re-sync form when the underlying record changes (e.g. after refetch).
  useEffect(() => {
    form.reset({ name: user.name, email: user.email, phone: user.phone ?? '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.name, user.email, user.phone]);

  const onSubmit = (values: EditUserValues) => {
    updateMutation.mutate(
      {
        name: values.name,
        email: values.email,
        phone: values.phone ? values.phone : null,
      },
      {
        onSuccess: () => toast.success('User updated'),
        onError: (err) => applyServerErrors(err, (field, e) => form.setError(field as never, e), (m) => toast.error(m)),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
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
                {...form.register('email')}
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
                {...form.register('phone')}
              />
            )}
          </FormField>
          <FormActions>
            <Button type="submit" isLoading={updateMutation.isPending} leftIcon={<Save className="h-4 w-4" />}>
              Save changes
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
}

function StatusAndRoleCard({ user, isSelf }: { user: UserDTO; isSelf: boolean }) {
  const statusMutation = useUpdateUserStatus(user.id);
  const roleMutation = useUpdateUserRole(user.id);

  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const [pendingRole, setPendingRole] = useState<RoleName | null>(null);

  const confirmStatus = () => {
    if (pendingStatus === null) return;
    statusMutation.mutate(
      { is_active: pendingStatus },
      {
        onSuccess: () => {
          toast.success(pendingStatus ? 'User reactivated' : 'User deactivated');
          setPendingStatus(null);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'CONFLICT') {
            toast.error('You cannot deactivate or change your own role.');
          } else {
            toast.error(err.message);
          }
          setPendingStatus(null);
        },
      },
    );
  };

  const confirmRole = () => {
    if (pendingRole === null) return;
    roleMutation.mutate(
      { role: pendingRole },
      {
        onSuccess: () => {
          toast.success('Role updated');
          setPendingRole(null);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'CONFLICT') {
            toast.error('You cannot deactivate or change your own role.');
          } else {
            toast.error(err.message);
          }
          setPendingRole(null);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Account status</p>
            <p className="text-xs text-slate-500">
              {user.is_active ? 'This user can sign in.' : 'Sign-in is disabled.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ActiveBadge active={user.is_active} />
            <Switch
              checked={user.is_active}
              onCheckedChange={(next) => setPendingStatus(next)}
              disabled={isSelf || statusMutation.isPending}
              aria-label="Toggle account status"
            />
          </div>
        </div>
        {isSelf && (
          <p className="text-xs text-slate-400">You cannot deactivate or demote your own account.</p>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div>
            <p className="text-sm font-medium text-slate-700">Role</p>
            <p className="text-xs text-slate-500">Changing the role updates this user&apos;s permissions.</p>
          </div>
          <Select
            className="w-44"
            value={user.role}
            disabled={isSelf || roleMutation.isPending}
            onChange={(e) => {
              const next = e.target.value as RoleName;
              if (next !== user.role) setPendingRole(next);
            }}
            aria-label="Change role"
            options={[
              { value: 'CUSTOMER', label: 'Customer' },
              { value: 'PROVIDER', label: 'Provider' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
        </div>
      </CardContent>

      <ConfirmDialog
        open={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        onConfirm={confirmStatus}
        title={pendingStatus ? 'Reactivate this user?' : 'Deactivate this user?'}
        description={
          pendingStatus
            ? 'They will be able to sign in again.'
            : 'They will be signed out and unable to sign in until reactivated.'
        }
        confirmLabel={pendingStatus ? 'Reactivate' : 'Deactivate'}
        destructive={!pendingStatus}
        isLoading={statusMutation.isPending}
      />
      <ConfirmDialog
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        onConfirm={confirmRole}
        title="Change this user's role?"
        description={pendingRole ? `Their role will change to ${pendingRole}.` : undefined}
        confirmLabel="Change role"
        isLoading={roleMutation.isPending}
      />
    </Card>
  );
}

function ProviderProfilePanel({ userId }: { userId: number }) {
  const { data: profile, isLoading, isError, error, refetch } = useProviderProfile(userId);
  const upsertMutation = useUpsertProviderProfile(userId);

  const form = useForm<ProviderProfileValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: { bio: '', skills: '', service_area: '', is_verified: false },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        bio: profile.bio ?? '',
        skills: profile.skills ?? '',
        service_area: profile.service_area ?? '',
        is_verified: profile.is_verified,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.updated_at]);

  // 404 means "no profile yet" — that's a normal empty state, not a hard error.
  const notFound = isError && error instanceof ApiError && error.status === 404;

  const onSubmit = (values: ProviderProfileValues) => {
    upsertMutation.mutate(
      {
        bio: values.bio ? values.bio : null,
        skills: values.skills ? values.skills : null,
        service_area: values.service_area ? values.service_area : null,
        is_verified: values.is_verified,
      },
      {
        onSuccess: () => toast.success('Provider profile saved'),
        onError: (err) => applyServerErrors(err, (field, e) => form.setError(field as never, e), (m) => toast.error(m)),
      },
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider profile</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState variant="lines" rows={4} />
        </CardContent>
      </Card>
    );
  }

  if (isError && !notFound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState error={error} onRetry={() => refetch()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Provider profile</CardTitle>
        {profile ? (
          <div className="flex items-center gap-2">
            <VerifiedBadge verified={profile.is_verified} />
            <span className="text-sm text-slate-500">Rating {profile.rating}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">No provider profile yet — create one.</span>
        )}
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <FormField name="bio" label="Bio">
            {(p) => (
              <Textarea
                id={p.id}
                invalid={p.invalid}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                placeholder="Short professional bio…"
                {...form.register('bio')}
              />
            )}
          </FormField>
          <FormField name="skills" label="Skills" hint="Comma-separated (CSV), up to 500 chars.">
            {(p) => (
              <Input
                id={p.id}
                invalid={p.invalid}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                placeholder="plumbing, electrical, hvac"
                {...form.register('skills')}
              />
            )}
          </FormField>
          <FormField name="service_area" label="Service area">
            {(p) => (
              <Input
                id={p.id}
                invalid={p.invalid}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                placeholder="Greater Boston"
                {...form.register('service_area')}
              />
            )}
          </FormField>
          <FormField name="is_verified" label="Verified">
            {(p) => (
              <div className="flex items-center gap-3">
                <Switch
                  id={p.id}
                  checked={form.watch('is_verified')}
                  onCheckedChange={(c) => form.setValue('is_verified', c)}
                  aria-label="Verified"
                />
                <span className="text-sm text-slate-600">
                  {form.watch('is_verified') ? 'Marked as verified' : 'Not verified'}
                </span>
              </div>
            )}
          </FormField>
          <FormActions>
            <Button type="submit" isLoading={upsertMutation.isPending} leftIcon={<Save className="h-4 w-4" />}>
              {profile ? 'Save profile' : 'Create profile'}
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
}

function UserDetailInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const id = Number(params.id);

  const { data: user, isLoading, isError, error, refetch } = useUser(id);

  if (isLoading) {
    return <LoadingState variant="lines" rows={8} />;
  }

  if (isError || !user) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="space-y-4">
        <ErrorState
          error={error}
          title={notFound ? 'User not found' : 'Unable to load user'}
          onRetry={notFound ? undefined : () => refetch()}
        />
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => router.push('/users')}>
            Back to users
          </Button>
        </div>
      </div>
    );
  }

  const isSelf = currentUser?.id === user.id;
  const isProvider = user.role === 'PROVIDER';

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/users')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={user.role} />
          <ActiveBadge active={user.is_active} />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Joined <DateTimeText value={user.created_at} format="date" /> · last updated{' '}
        <DateTimeText value={user.updated_at} format="relative" />
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <EditUserForm user={user} />
        <StatusAndRoleCard user={user} isSelf={isSelf} />
      </div>

      {isProvider && (
        <>
          <ProviderProfilePanel userId={user.id} />
          <AvailabilityEditor providerId={user.id} />
        </>
      )}
    </div>
  );
}

export default function UserDetailPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell title="User detail">
        <UserDetailInner />
      </AppShell>
    </ProtectedRoute>
  );
}
