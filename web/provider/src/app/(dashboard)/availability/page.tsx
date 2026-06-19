'use client';

// src/app/(dashboard)/availability/page.tsx (00 §4.2 P-7, 02 §8.7) — PROVIDER weekly
// availability manager. Lists the provider's own windows grouped by day; add (POST),
// edit (PATCH /:id), toggle is_available (PATCH /:id), and remove (DELETE /:id).
// RHF + zod forms surface 422 details. Renders loading / empty / error / success states.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CalendarClock, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { FormActions } from '@/components/forms/FormActions';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { dayOfWeekEnum, timeSchema, applyServerErrors } from '@/lib/validation/common';
import {
  useAvailability,
  useCreateAvailability,
  useDeleteAvailability,
  useUpdateAvailability,
} from '@/lib/hooks/useAvailability';
import type { DayOfWeek, ProviderAvailabilityDTO } from '@/types/api';

const DAY_ORDER: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABEL: Record<DayOfWeek, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};
const DAY_OPTIONS = DAY_ORDER.map((d) => ({ value: d, label: DAY_LABEL[d] }));

// `end_time > start_time` enforced client-side (mirrors the 02 §8.7 server rule);
// the server stays the source of truth on 422.
const availabilitySchema = z
  .object({
    day_of_week: dayOfWeekEnum,
    start_time: timeSchema,
    end_time: timeSchema,
    is_available: z.boolean(),
  })
  .refine((v) => v.end_time > v.start_time, {
    path: ['end_time'],
    message: 'must be after start time',
  });

type AvailabilityValues = z.infer<typeof availabilitySchema>;

// 'HH:mm:ss' → 'HH:mm' for inputs + display.
function fmtTime(t: string): string {
  return t.length >= 5 ? t.slice(0, 5) : t;
}

// ----- Add-window form -----
function AddWindowForm() {
  const createMutation = useCreateAvailability();

  const form = useForm<AvailabilityValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      day_of_week: 'MON',
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
    },
  });

  const onAdd = (values: AvailabilityValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Availability window added');
        form.reset();
      },
      onError: (err) =>
        applyServerErrors(
          err,
          (field, e) => form.setError(field as keyof AvailabilityValues, e),
          (m) => toast.error(m),
        ),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a window</CardTitle>
        <CardDescription>
          Define a weekly slot when customers can book you. Times are in your local timezone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onAdd} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField name="day_of_week" label="Day" required>
              {(p) => (
                <Select
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  options={DAY_OPTIONS}
                  {...form.register('day_of_week')}
                />
              )}
            </FormField>

            <FormField name="start_time" label="Start time" required>
              {(p) => (
                <Input
                  type="time"
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  {...form.register('start_time')}
                />
              )}
            </FormField>

            <FormField name="end_time" label="End time" required>
              {(p) => (
                <Input
                  type="time"
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  {...form.register('end_time')}
                />
              )}
            </FormField>

            <FormField name="is_available" label="Available">
              {(p) => (
                <div className="flex h-10 items-center gap-3">
                  <Switch
                    id={p.id}
                    checked={form.watch('is_available')}
                    onCheckedChange={(c) => form.setValue('is_available', c)}
                    aria-label="Available"
                  />
                  <span className="text-sm text-slate-600">
                    {form.watch('is_available') ? 'Bookable' : 'Blocked'}
                  </span>
                </div>
              )}
            </FormField>
          </div>
          <FormActions>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add window
            </Button>
          </FormActions>
        </Form>
      </CardContent>
    </Card>
  );
}

// ----- Edit-window dialog (PATCH /:id) -----
function EditWindowDialog({
  row,
  onClose,
}: {
  row: ProviderAvailabilityDTO | null;
  onClose: () => void;
}) {
  const updateMutation = useUpdateAvailability();

  const form = useForm<AvailabilityValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      day_of_week: 'MON',
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
    },
  });

  // Re-seed the form whenever a new row is opened for editing.
  useEffect(() => {
    if (row) {
      form.reset({
        day_of_week: row.day_of_week,
        start_time: fmtTime(row.start_time),
        end_time: fmtTime(row.end_time),
        is_available: row.is_available,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id, row?.updated_at]);

  const onSave = (values: AvailabilityValues) => {
    if (!row) return;
    updateMutation.mutate(
      { id: row.id, body: values },
      {
        onSuccess: () => {
          toast.success('Availability window updated');
          onClose();
        },
        onError: (err) =>
          applyServerErrors(
            err,
            (field, e) => form.setError(field as keyof AvailabilityValues, e),
            (m) => toast.error(m),
          ),
      },
    );
  };

  return (
    <Dialog
      open={row !== null}
      onClose={onClose}
      title="Edit availability window"
      description="Update the day, times, or whether the slot is bookable."
    >
      <Form form={form} onSubmit={onSave} className="space-y-4">
        <FormField name="day_of_week" label="Day" required>
          {(p) => (
            <Select
              id={p.id}
              invalid={p.invalid}
              aria-invalid={p['aria-invalid']}
              aria-describedby={p['aria-describedby']}
              options={DAY_OPTIONS}
              {...form.register('day_of_week')}
            />
          )}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="start_time" label="Start time" required>
            {(p) => (
              <Input
                type="time"
                id={p.id}
                invalid={p.invalid}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('start_time')}
              />
            )}
          </FormField>

          <FormField name="end_time" label="End time" required>
            {(p) => (
              <Input
                type="time"
                id={p.id}
                invalid={p.invalid}
                aria-invalid={p['aria-invalid']}
                aria-describedby={p['aria-describedby']}
                {...form.register('end_time')}
              />
            )}
          </FormField>
        </div>

        <FormField name="is_available" label="Available">
          {(p) => (
            <div className="flex items-center gap-3">
              <Switch
                id={p.id}
                checked={form.watch('is_available')}
                onCheckedChange={(c) => form.setValue('is_available', c)}
                aria-label="Available"
              />
              <span className="text-sm text-slate-600">
                {form.watch('is_available') ? 'Bookable' : 'Blocked'}
              </span>
            </div>
          )}
        </FormField>

        <FormActions>
          <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateMutation.isPending}>
            Save changes
          </Button>
        </FormActions>
      </Form>
    </Dialog>
  );
}

// ----- Weekly list grouped by day -----
function WeeklyList() {
  const query = useAvailability();
  const updateMutation = useUpdateAvailability();
  const deleteMutation = useDeleteAvailability();

  const [editing, setEditing] = useState<ProviderAvailabilityDTO | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProviderAvailabilityDTO | null>(null);

  const onToggleAvailable = (row: ProviderAvailabilityDTO, next: boolean) => {
    updateMutation.mutate(
      { id: row.id, body: { is_available: next } },
      {
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        toast.success('Availability window removed');
        setPendingDelete(null);
      },
      onError: (err) => {
        toast.error(err.message);
        setPendingDelete(null);
      },
    });
  };

  const rows = query.data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly availability</CardTitle>
        <CardDescription>Your windows, grouped by day of the week.</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <LoadingState variant="lines" rows={5} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No availability windows yet."
            description="Add a window above to tell customers when you're bookable."
          />
        ) : (
          <div className="space-y-6">
            {DAY_ORDER.map((day) => {
              const dayRows = rows
                .filter((r) => r.day_of_week === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              if (dayRows.length === 0) return null;
              return (
                <div key={day}>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">{DAY_LABEL[day]}</h3>
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {dayRows.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="font-medium text-slate-900">
                            {fmtTime(row.start_time)} – {fmtTime(row.end_time)}
                          </span>
                          <Badge color={row.is_available ? 'green' : 'slate'}>
                            {row.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="hidden sm:inline">
                              {row.is_available ? 'Bookable' : 'Blocked'}
                            </span>
                            <Switch
                              checked={row.is_available}
                              onCheckedChange={(c) => onToggleAvailable(row, c)}
                              disabled={updateMutation.isPending}
                              aria-label={`Toggle availability for ${DAY_LABEL[row.day_of_week]} ${fmtTime(
                                row.start_time,
                              )}`}
                            />
                          </label>
                          <IconButton
                            label="Edit window"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            label="Delete window"
                            variant="danger"
                            size="sm"
                            onClick={() => setPendingDelete(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <EditWindowDialog row={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete availability window?"
        description={
          pendingDelete
            ? `${DAY_LABEL[pendingDelete.day_of_week]} ${fmtTime(pendingDelete.start_time)}–${fmtTime(
                pendingDelete.end_time,
              )} will be removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
      />
    </Card>
  );
}

function AvailabilityInner() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Availability</h1>
          <p className="text-sm text-slate-500">
            Manage the weekly windows when you accept new jobs.
          </p>
        </div>
      </div>

      <AddWindowForm />
      <WeeklyList />
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <AppShell title="Availability">
      <AvailabilityInner />
    </AppShell>
  );
}
