'use client';

// src/app/book/[serviceId]/page.tsx — C-6 Booking Form (+ C-11 mocked payment).
// 04 §B.2.7 / 02 §8.6: GET /services/:id (price preview) → POST /bookings → (bonus)
// POST /bookings/:id/payment → redirect to /bookings/:id. CUSTOMER-only; mirrors the RN
// CreateBooking screen (§B.10). Renders loading / empty / error / success states.
import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, CalendarClock, CheckCircle2, CreditCard, MapPin } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { MoneyText } from '@/components/domain/MoneyText';

import { useService } from '@/lib/hooks/useServices';
import { useCreateBooking, useCreateBookingPayment } from '@/lib/hooks/useCreateBooking';
import { applyServerErrors } from '@/lib/validation/common';
import { localInputToIsoUtc } from '@/lib/format/date';
import { ApiError } from '@/lib/api/errors';

// --- Form schema (04 §9 bookingSchema, adapted for the local datetime-local input) ---
// The control holds a LOCAL "YYYY-MM-DDTHH:mm" value; we convert to ISO-8601 UTC on submit.
const bookingFormSchema = z.object({
  scheduled_at: z
    .string()
    .min(1, 'Pick a date and time')
    .refine((v) => {
      const iso = localInputToIsoUtc(v);
      return iso !== '' && new Date(iso).getTime() > Date.now();
    }, 'must be in the future'),
  address: z.string().max(500, 'must be at most 500 characters').optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  pay_now: z.boolean().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Minimum selectable value for the datetime-local control = now (local), minute precision.
function nowLocalInputMin(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60_000);
  return local.toISOString().slice(0, 16);
}

function BookingFormScreen() {
  const params = useParams<{ serviceId: string }>();
  const router = useRouter();
  const serviceId = Number(params.serviceId);

  const serviceQuery = useService(serviceId);
  const createBooking = useCreateBooking();
  const [pendingPaymentId, setPendingPaymentId] = useState<number | null>(null);
  const createPayment = useCreateBookingPayment(pendingPaymentId ?? 0);

  const minDateTime = useMemo(() => nowLocalInputMin(), []);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { scheduled_at: '', address: '', notes: '', pay_now: false },
  });

  const submitting = createBooking.isPending || createPayment.isPending;

  // --- Loading / error / empty for the service preview (04 §B.2.7) ---
  if (!Number.isFinite(serviceId)) {
    return (
      <EmptyState
        title="Service not found"
        description="That booking link is invalid."
        action={
          <Link href="/services">
            <Button variant="outline">Browse services</Button>
          </Link>
        }
      />
    );
  }

  if (serviceQuery.isLoading) {
    return <LoadingState variant="lines" rows={6} label="Loading service…" />;
  }

  if (serviceQuery.isError) {
    const err = serviceQuery.error;
    // 404 → the service is gone; show a friendly empty state rather than a hard error.
    if (err instanceof ApiError && err.status === 404) {
      return (
        <EmptyState
          title="Service unavailable"
          description="This service no longer exists or has been deactivated."
          action={
            <Link href="/services">
              <Button variant="outline">Browse services</Button>
            </Link>
          }
        />
      );
    }
    return (
      <ErrorState
        error={err}
        title="Unable to load service"
        onRetry={() => serviceQuery.refetch()}
      />
    );
  }

  const service = serviceQuery.data;
  if (!service) {
    return (
      <EmptyState
        title="Service unavailable"
        description="We couldn't load this service. Please try another."
        action={
          <Link href="/services">
            <Button variant="outline">Browse services</Button>
          </Link>
        }
      />
    );
  }

  const onSubmit = async (values: BookingFormValues) => {
    const scheduledIso = localInputToIsoUtc(values.scheduled_at);
    if (!scheduledIso) {
      form.setError('scheduled_at', { message: 'Pick a valid date and time' });
      return;
    }

    try {
      const booking = await createBooking.mutateAsync({
        service_id: service.id,
        scheduled_at: scheduledIso,
        address: values.address?.trim() ? values.address.trim() : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      });

      // Bonus C-11: optional mocked payment immediately after creation.
      if (values.pay_now) {
        setPendingPaymentId(booking.id);
        try {
          await createPayment.mutateAsync({ method: 'MOCK', status: 'PAID' });
          toast.success('Booking placed and paid');
        } catch (payErr) {
          // Booking succeeded; payment is best-effort and can be retried on the detail page.
          const message =
            payErr instanceof ApiError ? payErr.message : 'Payment could not be processed';
          toast.error(`Booking placed, but payment failed: ${message}`);
        }
      } else {
        toast.success('Booking placed');
      }

      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      applyServerErrors(
        err,
        (field, e) => form.setError(field as keyof BookingFormValues, e),
        (m) => toast.error(m),
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href={`/services/${service.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to service
      </Link>

      <h1 className="text-xl font-semibold text-slate-900">Book {service.name}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Choose a date and time, then confirm your booking.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* --- Form --- */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <Form form={form} onSubmit={onSubmit}>
                <FormField
                  name="scheduled_at"
                  label="Date & time"
                  required
                  hint="We'll convert your local time to the provider's schedule."
                >
                  {({ id, invalid, ...aria }) => (
                    <Input
                      id={id}
                      type="datetime-local"
                      min={minDateTime}
                      invalid={invalid}
                      leftIcon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
                      {...aria}
                      {...form.register('scheduled_at')}
                    />
                  )}
                </FormField>

                <FormField name="address" label="Address" hint="Optional — where should we come?">
                  {({ id, invalid, ...aria }) => (
                    <Input
                      id={id}
                      placeholder="12 Maple St, Springfield"
                      maxLength={500}
                      invalid={invalid}
                      leftIcon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                      {...aria}
                      {...form.register('address')}
                    />
                  )}
                </FormField>

                <FormField name="notes" label="Notes" hint="Optional — anything the provider should know.">
                  {({ id, invalid, ...aria }) => (
                    <Textarea
                      id={id}
                      rows={4}
                      placeholder="Please bring eco-friendly supplies…"
                      invalid={invalid}
                      {...aria}
                      {...form.register('notes')}
                    />
                  )}
                </FormField>

                <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <Checkbox className="mt-0.5" {...form.register('pay_now')} />
                  <span className="text-sm text-slate-700">
                    <span className="flex items-center gap-1.5 font-medium text-slate-900">
                      <CreditCard className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      Pay now (mocked)
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Record a mocked payment immediately. You can also pay later from the
                      booking page.
                    </span>
                  </span>
                </label>

                <FormActions>
                  <Link href={`/services/${service.id}`}>
                    <Button type="button" variant="ghost" disabled={submitting}>
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    leftIcon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  >
                    {form.watch('pay_now') ? 'Confirm & pay' : 'Confirm booking'}
                  </Button>
                </FormActions>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* --- Price summary --- */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500">Service</span>
                <span className="text-right font-medium text-slate-900">{service.name}</span>
              </div>
              {service.duration_minutes != null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Duration</span>
                  <span className="text-slate-900">{service.duration_minutes} min</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-medium text-slate-900">Total</span>
                <span className="text-base font-semibold text-slate-900">
                  <MoneyText amount={service.price} currency={service.currency} />
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The provider confirms availability after you book. The price is locked at the
                time of booking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BookServicePage() {
  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <BookingFormScreen />
    </ProtectedRoute>
  );
}
