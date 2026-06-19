'use client';

// src/app/(dashboard)/providers/[id]/page.tsx (04 §A.2.10) — Provider detail (A-10).
// Header (GET /users/:id) + provider profile editor (GET/PUT /profile/provider) +
// AvailabilityEditor (provider-availability CRUD). Four UI states per panel.
import { useEffect } from 'react';
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
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { RoleBadge } from '@/components/domain/RoleBadge';
import { ActiveBadge } from '@/components/domain/ActiveBadge';
import { VerifiedBadge } from '@/components/domain/VerifiedBadge';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { AvailabilityEditor } from '@/components/domain/AvailabilityEditor';
import { applyServerErrors } from '@/lib/validation/common';
import { ApiError } from '@/lib/api/errors';
import {
  useProviderProfile,
  useUpsertProviderProfile,
  useUser,
} from '@/lib/hooks/useUsers';

const providerProfileSchema = z.object({
  bio: z.string().max(2000, 'must be at most 2000 characters').optional().or(z.literal('')),
  skills: z.string().max(500, 'must be at most 500 characters').optional().or(z.literal('')),
  service_area: z.string().max(255, 'must be at most 255 characters').optional().or(z.literal('')),
  is_verified: z.boolean(),
});
type ProviderProfileValues = z.infer<typeof providerProfileSchema>;

function ProviderProfileForm({ userId }: { userId: number }) {
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
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {!profile && (
          <EmptyState
            title="No provider profile yet — create one."
            description="Fill in the details below and save to create this provider's profile."
          />
        )}
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

function ProviderDetailInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
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
          title={notFound ? 'Provider not found' : 'Unable to load provider'}
          onRetry={notFound ? undefined : () => refetch()}
        />
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => router.push('/providers')}>
            Back to providers
          </Button>
        </div>
      </div>
    );
  }

  // Guard: the route is for PROVIDER users; if not a provider, point the admin to /users/:id.
  if (user.role !== 'PROVIDER') {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Not a provider"
          description={`${user.name} has the ${user.role} role. Manage this account from the Users screen.`}
          action={
            <Button variant="outline" size="sm" onClick={() => router.push(`/users/${user.id}`)}>
              Open user detail
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.push('/providers')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to providers
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
        Joined <DateTimeText value={user.created_at} format="date" /> ·{' '}
        <button
          type="button"
          className="text-brand hover:underline"
          onClick={() => router.push(`/users/${user.id}`)}
        >
          Edit account
        </button>
      </p>

      <ProviderProfileForm userId={user.id} />
      <AvailabilityEditor providerId={user.id} />
    </div>
  );
}

export default function ProviderDetailPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell title="Provider detail">
        <ProviderDetailInner />
      </AppShell>
    </ProtectedRoute>
  );
}
