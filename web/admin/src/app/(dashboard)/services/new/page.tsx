'use client';

// /services/new — Create service (A-5, 04 §A.2.7).
// RHF + zod form (ServiceForm). Maps 422 ApiError.details onto fields and surfaces
// 409 DUPLICATE_RESOURCE (name unique within category) as a form-level error.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormError } from '@/components/forms/FormError';
import { FormActions } from '@/components/forms/FormActions';
import { useCategoryOptions, useCreateService } from '@/lib/hooks/useServices';
import { applyServerErrors } from '@/lib/validation/common';
import type { CreateServiceRequest } from '@/lib/api/services';

// Mirrors 02 §8.5 create validation (04 §A.2.7 form fields). Price is kept as a
// 2-decimal STRING per the contract (DECIMAL fields are strings on the wire).
const serviceSchema = z.object({
  category_id: z.coerce.number({ invalid_type_error: 'Select a category' }).int().positive('Select a category'),
  name: z.string().min(2, 'must be at least 2 characters').max(160, 'must be at most 160 characters'),
  description: z.string().max(2000, 'must be at most 2000 characters').optional().or(z.literal('')),
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
  duration_minutes: z
    .union([z.coerce.number().int('must be a whole number').min(1, 'must be at least 1'), z.literal('')])
    .optional(),
  image_url: z.string().url('must be a valid URL').max(500, 'must be at most 500 characters').optional().or(z.literal('')),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

function NewServiceScreen() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const categoriesQuery = useCategoryOptions();
  const createMutation = useCreateService();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      category_id: 0,
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      duration_minutes: '',
      image_url: '',
      is_active: true,
    },
  });

  const isActive = form.watch('is_active');

  const onSubmit = (values: ServiceFormValues) => {
    setFormError(null);
    const body: CreateServiceRequest = {
      category_id: values.category_id,
      name: values.name,
      description: values.description ? values.description : null,
      price: values.price,
      currency: values.currency ? values.currency : undefined,
      duration_minutes:
        values.duration_minutes === '' || values.duration_minutes === undefined
          ? null
          : Number(values.duration_minutes),
      image_url: values.image_url ? values.image_url : null,
      is_active: values.is_active,
    };

    createMutation.mutate(body, {
      onSuccess: (service) => {
        toast.success('Service created');
        router.push(`/services/${service.id}`);
      },
      onError: (err) => {
        applyServerErrors(err, (field, e) => form.setError(field as keyof ServiceFormValues, e), (m) =>
          setFormError(m),
        );
      },
    });
  };

  if (categoriesQuery.isLoading) {
    return (
      <AppShell title="New service">
        <LoadingState variant="lines" rows={6} />
      </AppShell>
    );
  }

  if (categoriesQuery.isError) {
    return (
      <AppShell title="New service">
        <ErrorState
          title="Unable to load categories"
          error={categoriesQuery.error}
          onRetry={() => categoriesQuery.refetch()}
        />
      </AppShell>
    );
  }

  const categoryOptions = categoriesQuery.data?.items ?? [];

  return (
    <AppShell title="New service">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/services" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to services
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create a service</CardTitle>
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
                    {...form.register('category_id')}
                  >
                    <option value={0} disabled>
                      Select a category
                    </option>
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
                    placeholder="Deep Home Cleaning"
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
                    placeholder="Full-home deep cleaning"
                    invalid={p.invalid}
                    id={p.id}
                    aria-invalid={p['aria-invalid']}
                    aria-describedby={p['aria-describedby']}
                    {...form.register('description')}
                  />
                )}
              </FormField>

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

                <FormField name="currency" label="Currency" hint="3-letter ISO code (default USD).">
                  {(p) => (
                    <Input
                      placeholder="USD"
                      maxLength={3}
                      className="uppercase"
                      invalid={p.invalid}
                      id={p.id}
                      aria-invalid={p['aria-invalid']}
                      aria-describedby={p['aria-describedby']}
                      {...form.register('currency')}
                    />
                  )}
                </FormField>
              </div>

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
                      onCheckedChange={(checked) => form.setValue('is_active', checked)}
                      aria-label="Service is active"
                    />
                    <span className="text-sm text-slate-600">{isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                )}
              </FormField>

              <FormActions>
                <Link href="/services">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" isLoading={createMutation.isPending} leftIcon={<Save className="h-4 w-4" />}>
                  Create service
                </Button>
              </FormActions>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function NewServicePage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <NewServiceScreen />
    </ProtectedRoute>
  );
}
