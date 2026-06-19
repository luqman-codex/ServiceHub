'use client';

// /services/:id — Edit service + dedicated price editor + soft-delete (A-5/A-6, 04 §A.2.7).
// - Loads the service with ?include=category (loading/empty/error/success states).
// - ServiceForm: PATCH /services/:id (maps 422 details + 409 duplicate).
// - PriceEditorCard: separate inline form → PATCH /services/:id/price (with the A-6
//   "does not change existing bookings" helper note).
// - Deactivate: DELETE /services/:id (soft) behind a ConfirmDialog.
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Info, Save, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { ActiveBadge } from '@/components/domain/ActiveBadge';
import { MoneyText } from '@/components/domain/MoneyText';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormError } from '@/components/forms/FormError';
import { FormActions } from '@/components/forms/FormActions';
import {
  useCategoryOptions,
  useDeleteService,
  useService,
  useUpdateService,
  useUpdateServicePrice,
} from '@/lib/hooks/useServices';
import { applyServerErrors } from '@/lib/validation/common';
import type { UpdateServiceRequest, UpdateServicePriceRequest } from '@/lib/api/services';
import type { ServiceDTO } from '@/types/api';

// --- Edit form schema (subset of create; same per-field rules, 02 §8.5 PATCH) ---
const editSchema = z.object({
  category_id: z.coerce.number({ invalid_type_error: 'Select a category' }).int().positive('Select a category'),
  name: z.string().min(2, 'must be at least 2 characters').max(160, 'must be at most 160 characters'),
  description: z.string().max(2000, 'must be at most 2000 characters').optional().or(z.literal('')),
  duration_minutes: z
    .union([z.coerce.number().int('must be a whole number').min(1, 'must be at least 1'), z.literal('')])
    .optional(),
  image_url: z.string().url('must be a valid URL').max(500, 'must be at most 500 characters').optional().or(z.literal('')),
  is_active: z.boolean(),
});
type EditValues = z.infer<typeof editSchema>;

// --- Dedicated price form schema (02 §8.5 /price) ---
const priceSchema = z.object({
  price: z
    .string()
    .min(1, 'Price is required')
    .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Up to 8 digits and 2 decimals')
    .refine((v) => Number(v) <= 99999999.99, 'must be at most 99999999.99'),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, 'must be a 3-letter ISO currency code')
    .optional()
    .or(z.literal('')),
});
type PriceValues = z.infer<typeof priceSchema>;

function EditServiceForm({ service }: { service: ServiceDTO }) {
  const [formError, setFormError] = useState<string | null>(null);
  const categoriesQuery = useCategoryOptions();
  const updateMutation = useUpdateService(service.id);

  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      category_id: service.category_id,
      name: service.name,
      description: service.description ?? '',
      duration_minutes: service.duration_minutes ?? '',
      image_url: service.image_url ?? '',
      is_active: service.is_active,
    },
  });

  const isActive = form.watch('is_active');

  const categoryOptions = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data]);

  const onSubmit = (values: EditValues) => {
    setFormError(null);
    const body: UpdateServiceRequest = {
      category_id: values.category_id,
      name: values.name,
      description: values.description ? values.description : null,
      duration_minutes:
        values.duration_minutes === '' || values.duration_minutes === undefined
          ? null
          : Number(values.duration_minutes),
      image_url: values.image_url ? values.image_url : null,
      is_active: values.is_active,
    };
    updateMutation.mutate(body, {
      onSuccess: () => {
        toast.success('Service updated');
        form.reset(values);
      },
      onError: (err) => {
        applyServerErrors(err, (field, e) => form.setError(field as keyof EditValues, e), (m) => setFormError(m));
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service details</CardTitle>
        <CardDescription>Update the service’s catalog information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <FormError message={formError} />

          <FormField name="category_id" label="Category" required>
            {(p) => (
              <Select
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                disabled={categoriesQuery.isLoading}
                {...form.register('category_id')}
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </FormField>

          <FormField name="name" label="Name" required hint="2–160 characters, unique within the category.">
            {(p) => (
              <Input
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('name')}
              />
            )}
          </FormField>

          <FormField name="description" label="Description">
            {(p) => (
              <Textarea
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('description')}
              />
            )}
          </FormField>

          <FormField name="duration_minutes" label="Duration (minutes)" hint="Optional, whole number ≥ 1.">
            {(p) => (
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="180"
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('duration_minutes')}
              />
            )}
          </FormField>

          <FormField name="image_url" label="Image URL" hint="Optional, valid URL up to 500 characters.">
            {(p) => (
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                invalid={p.invalid}
                id={p.id}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('image_url')}
              />
            )}
          </FormField>

          <FormField name="is_active" label="Active">
            {(p) => (
              <div className="flex items-center gap-3">
                <Switch
                  id={p.id}
                  checked={isActive}
                  onCheckedChange={(checked) => form.setValue('is_active', checked, { shouldDirty: true })}
                  aria-label="Service is active"
                />
                <span className="text-sm text-slate-600">{isActive ? 'Active' : 'Inactive'}</span>
              </div>
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

function PriceEditorCard({ service }: { service: ServiceDTO }) {
  const [formError, setFormError] = useState<string | null>(null);
  const priceMutation = useUpdateServicePrice(service.id);

  const form = useForm<PriceValues>({
    resolver: zodResolver(priceSchema),
    defaultValues: { price: service.price, currency: service.currency },
  });

  // Keep the inputs in sync if the service reloads (e.g. after an edit elsewhere).
  useEffect(() => {
    form.reset({ price: service.price, currency: service.currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service.price, service.currency]);

  const onSubmit = (values: PriceValues) => {
    setFormError(null);
    const body: UpdateServicePriceRequest = {
      price: values.price,
      currency: values.currency ? values.currency : undefined,
    };
    priceMutation.mutate(body, {
      onSuccess: () => toast.success('Price updated'),
      onError: (err) => {
        applyServerErrors(err, (field, e) => form.setError(field as keyof PriceValues, e), (m) => setFormError(m));
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
        <CardDescription>
          Current price: <MoneyText amount={service.price} currency={service.currency} />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit}>
          <FormError message={formError} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField name="price" label="Price" required hint="0–99999999.99, up to 2 decimals.">
              {(p) => (
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="79.99"
                  invalid={p.invalid}
                  id={p.id}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  {...form.register('price')}
                />
              )}
            </FormField>

            <FormField name="currency" label="Currency" hint="3-letter ISO code.">
              {(p) => (
                <Input
                  maxLength={3}
                  className="uppercase"
                  placeholder="USD"
                  invalid={p.invalid}
                  id={p.id}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  {...form.register('currency')}
                />
              )}
            </FormField>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              Updating the price does not change existing bookings — each booking’s total is
              snapshotted at the time it was created.
            </span>
          </div>

          <FormActions>
            <Button type="submit" isLoading={priceMutation.isPending} leftIcon={<Save className="h-4 w-4" />}>
              Update price
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
}

function ServiceDetailScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const serviceQuery = useService(id);
  const deleteMutation = useDeleteService();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeactivate = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Service deactivated');
        setConfirmOpen(false);
        router.push('/services');
      },
      onError: (err) => {
        setConfirmOpen(false);
        toast.error(err.message);
      },
    });
  };

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <AppShell title="Service">
        <EmptyState
          title="Service not found"
          description="The service id in the URL is invalid."
          action={
            <Link href="/services">
              <Button variant="outline" size="sm">
                Back to services
              </Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  if (serviceQuery.isLoading) {
    return (
      <AppShell title="Service">
        <LoadingState variant="lines" rows={8} />
      </AppShell>
    );
  }

  if (serviceQuery.isError) {
    const notFound = serviceQuery.error?.status === 404;
    if (notFound) {
      return (
        <AppShell title="Service">
          <EmptyState
            title="Service not found"
            description="This service may have been removed."
            action={
              <Link href="/services">
                <Button variant="outline" size="sm">
                  Back to services
                </Button>
              </Link>
            }
          />
        </AppShell>
      );
    }
    return (
      <AppShell title="Service">
        <ErrorState error={serviceQuery.error} onRetry={() => serviceQuery.refetch()} />
      </AppShell>
    );
  }

  const service = serviceQuery.data;
  if (!service) {
    return (
      <AppShell title="Service">
        <EmptyState title="Service not found" />
      </AppShell>
    );
  }

  return (
    <AppShell title={service.name}>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/services" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to services
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-slate-900">{service.name}</h1>
              <ActiveBadge active={service.is_active} />
            </div>
            <p className="text-sm text-slate-500">
              {service.category?.name ?? `Category #${service.category_id}`} · Created{' '}
              <DateTimeText value={service.created_at} format="date" />
            </p>
          </div>
          {service.is_active && (
            <Button
              variant="danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setConfirmOpen(true)}
            >
              Deactivate
            </Button>
          )}
        </div>

        <EditServiceForm service={service} />
        <PriceEditorCard service={service} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeactivate}
        title="Deactivate service?"
        description="This soft-deletes the service (sets it inactive). Existing bookings are unaffected. You can reactivate it later by editing it."
        confirmLabel="Deactivate"
        destructive
        isLoading={deleteMutation.isPending}
      />
    </AppShell>
  );
}

export default function ServiceDetailPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <ServiceDetailScreen />
    </ProtectedRoute>
  );
}
