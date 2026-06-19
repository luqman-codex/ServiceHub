'use client';

// src/components/domain/StatusTransitionPanel.tsx (04 §A.2.9) — admin operational
// controls for a single booking: apply any LEGAL status transition (PATCH
// /bookings/:id/status) and assign/reassign/unassign a provider (PATCH
// /bookings/:id/assign). Forms use react-hook-form + zod; server 422 details map onto
// fields; terminal bookings disable both controls (the API would return 409).
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormError } from '@/components/forms/FormError';
import { ApiError, type FieldError } from '@/lib/api/errors';
import { useAssignBookingProvider, useSetBookingStatus } from '@/lib/hooks/useBookings';
import type { BookingDTO, BookingStatus, UserDTO } from '@/types/api';

// 01 §5.3 legal-transition adjacency — the targets an ADMIN may set from each state.
const ADJACENCY: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

const TERMINAL: BookingStatus[] = ['REJECTED', 'COMPLETED', 'CANCELLED'];

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const REASON_REQUIRED: BookingStatus[] = ['REJECTED', 'CANCELLED'];

// --- Status transition form schema ---
const statusSchema = z
  .object({
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    cancellation_reason: z.string().trim().max(2000, 'Must be at most 2000 characters').optional(),
  })
  .refine(
    (v) =>
      !REASON_REQUIRED.includes(v.status) ||
      (v.cancellation_reason != null && v.cancellation_reason.length >= 1),
    { path: ['cancellation_reason'], message: 'A reason is required for this status' },
  );
type StatusValues = z.infer<typeof statusSchema>;

// --- Assign form schema (value is the provider id as a string, '' = unassign) ---
const assignSchema = z.object({ provider_id: z.string() });
type AssignValues = z.infer<typeof assignSchema>;

function applyServerFieldErrors<T extends Record<string, unknown>>(
  err: unknown,
  setError: (name: keyof T & string, e: { type: string; message: string }) => void,
  known: (keyof T & string)[],
): string | null {
  if (!(err instanceof ApiError)) return 'Something went wrong. Please try again.';
  if (err.status === 422 && err.details?.length) {
    let matchedAny = false;
    err.details.forEach((d: FieldError) => {
      if (known.includes(d.field as keyof T & string)) {
        matchedAny = true;
        setError(d.field as keyof T & string, { type: 'server', message: d.message });
      }
    });
    if (matchedAny) return null;
  }
  return err.message;
}

export interface StatusTransitionPanelProps {
  booking: BookingDTO;
  providers: UserDTO[];
  providersLoading?: boolean;
}

export function StatusTransitionPanel({
  booking,
  providers,
  providersLoading = false,
}: StatusTransitionPanelProps) {
  const isTerminal = TERMINAL.includes(booking.status);
  const targets = ADJACENCY[booking.status];

  const setStatus = useSetBookingStatus(booking.id);
  const assign = useAssignBookingProvider(booking.id);

  const [statusFormError, setStatusFormError] = useState<string | null>(null);
  const [assignFormError, setAssignFormError] = useState<string | null>(null);

  const statusForm = useForm<StatusValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: targets[0] ?? booking.status,
      cancellation_reason: '',
    },
  });

  // Keep the default target valid if the booking's current status changes underneath us.
  useEffect(() => {
    if (targets.length > 0) {
      statusForm.setValue('status', targets[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.status]);

  const selectedStatus = statusForm.watch('status');
  const reasonRequired = REASON_REQUIRED.includes(selectedStatus);

  const assignForm = useForm<AssignValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { provider_id: booking.provider_id != null ? String(booking.provider_id) : '' },
  });

  useEffect(() => {
    assignForm.reset({
      provider_id: booking.provider_id != null ? String(booking.provider_id) : '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.provider_id]);

  const statusOptions = useMemo(
    () => targets.map((t) => ({ label: STATUS_LABEL[t], value: t })),
    [targets],
  );

  const providerOptions = useMemo(
    () => [
      { label: 'Unassigned', value: '' },
      ...providers.map((p) => ({ label: `${p.name} (#${p.id})`, value: String(p.id) })),
    ],
    [providers],
  );

  const onSubmitStatus = (values: StatusValues) => {
    setStatusFormError(null);
    setStatus.mutate(
      {
        status: values.status,
        cancellation_reason:
          REASON_REQUIRED.includes(values.status) && values.cancellation_reason
            ? values.cancellation_reason
            : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Booking moved to ${STATUS_LABEL[values.status]}`);
          statusForm.reset({ status: values.status, cancellation_reason: '' });
        },
        onError: (err) => {
          const msg = applyServerFieldErrors<StatusValues>(
            err,
            (name, e) => statusForm.setError(name, e),
            ['status', 'cancellation_reason'],
          );
          setStatusFormError(msg);
        },
      },
    );
  };

  const onSubmitAssign = (values: AssignValues) => {
    setAssignFormError(null);
    const providerId = values.provider_id === '' ? null : Number(values.provider_id);
    assign.mutate(
      { provider_id: providerId },
      {
        onSuccess: () => {
          toast.success(providerId === null ? 'Provider unassigned' : 'Provider assigned');
        },
        onError: (err) => {
          const msg = applyServerFieldErrors<AssignValues>(
            err,
            (name, e) => assignForm.setError(name, e),
            ['provider_id'],
          );
          setAssignFormError(msg);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Status transition */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            Current: {STATUS_LABEL[booking.status]}. Apply any legal transition.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTerminal || targets.length === 0 ? (
            <p className="text-sm text-slate-500">
              This booking is in a terminal state ({STATUS_LABEL[booking.status]}). No further
              status changes are allowed.
            </p>
          ) : (
            <Form form={statusForm} onSubmit={onSubmitStatus}>
              <FormError message={statusFormError} />
              <FormField name="status" label="New status" required>
                {({ id, invalid, ...aria }) => (
                  <Select
                    id={id}
                    invalid={invalid}
                    options={statusOptions}
                    {...statusForm.register('status')}
                    {...aria}
                  />
                )}
              </FormField>

              {reasonRequired && (
                <FormField
                  name="cancellation_reason"
                  label="Cancellation reason"
                  required
                  hint="Required when rejecting or cancelling (1–2000 characters)."
                >
                  {({ id, invalid, ...aria }) => (
                    <Textarea
                      id={id}
                      invalid={invalid}
                      placeholder="Explain why this booking is being rejected/cancelled…"
                      {...statusForm.register('cancellation_reason')}
                      {...aria}
                    />
                  )}
                </FormField>
              )}

              <div className="flex justify-end">
                <Button type="submit" isLoading={setStatus.isPending}>
                  Apply transition
                </Button>
              </div>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Assign provider */}
      <Card>
        <CardHeader>
          <CardTitle>Provider</CardTitle>
          <CardDescription>Assign, reassign, or unassign the provider.</CardDescription>
        </CardHeader>
        <CardContent>
          {isTerminal ? (
            <p className="text-sm text-slate-500">
              Provider assignment is disabled for terminal bookings.
            </p>
          ) : (
            <Form form={assignForm} onSubmit={onSubmitAssign}>
              <FormError message={assignFormError} />
              <FormField name="provider_id" label="Assigned provider">
                {({ id, invalid, ...aria }) => (
                  <Select
                    id={id}
                    invalid={invalid}
                    options={providerOptions}
                    disabled={providersLoading}
                    {...assignForm.register('provider_id')}
                    {...aria}
                  />
                )}
              </FormField>
              <div className="flex justify-end">
                <Button type="submit" variant="secondary" isLoading={assign.isPending}>
                  Save assignment
                </Button>
              </div>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
