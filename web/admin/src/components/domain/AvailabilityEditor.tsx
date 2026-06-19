'use client';

// src/components/domain/AvailabilityEditor.tsx (04 §A.2.5, §A.2.10)
// Weekly availability grid for one PROVIDER user (provider_id === user id).
// Lists windows grouped by day, adds via an inline RHF+zod form, toggles availability,
// and deletes with a confirm dialog. Implements loading / empty / error / success states.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Form } from '@/components/forms/Form';
import { FormField } from '@/components/forms/FormField';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { dayOfWeekEnum, timeSchema, applyServerErrors } from '@/lib/validation/common';
import {
  useCreateAvailability,
  useDeleteAvailability,
  useProviderAvailability,
  useUpdateAvailability,
} from '@/lib/hooks/useProviderAvailability';
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

// `end_time > start_time` enforced client-side (mirrors 02 §8.7 server rule).
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

function fmtTime(t: string): string {
  // 'HH:mm:ss' → 'HH:mm'
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export interface AvailabilityEditorProps {
  /** The PROVIDER user's id (== provider_id for availability rows). */
  providerId: number;
}

export function AvailabilityEditor({ providerId }: AvailabilityEditorProps) {
  const query = useProviderAvailability(providerId);
  const createMutation = useCreateAvailability(providerId);
  const updateMutation = useUpdateAvailability(providerId);
  const deleteMutation = useDeleteAvailability(providerId);

  const [pendingDelete, setPendingDelete] = useState<ProviderAvailabilityDTO | null>(null);

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
      onError: (err) => applyServerErrors(err, (field, e) => form.setError(field as never, e), (m) => toast.error(m)),
    });
  };

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
    deleteMutation.mutate(pendingDelete.id, {
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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add window form */}
        <Form form={form} onSubmit={onAdd} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField name="day_of_week" label="Day">
              {(p) => (
                <Select
                  id={p.id}
                  invalid={p.invalid}
                  aria-invalid={p['aria-invalid']}
                  aria-describedby={p['aria-describedby']}
                  options={DAY_ORDER.map((d) => ({ value: d, label: DAY_LABEL[d] }))}
                  {...form.register('day_of_week')}
                />
              )}
            </FormField>

            <FormField name="start_time" label="Start time">
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

            <FormField name="end_time" label="End time">
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
                <div className="flex h-10 items-center">
                  <Switch
                    id={p.id}
                    checked={form.watch('is_available')}
                    onCheckedChange={(c) => form.setValue('is_available', c)}
                    aria-label="Available"
                  />
                </div>
              )}
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add window
            </Button>
          </div>
        </Form>

        {/* Window list — four states */}
        {query.isLoading ? (
          <LoadingState variant="lines" rows={4} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No availability windows yet."
            description="Add a window above to define when this provider is bookable."
          />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {DAY_ORDER.flatMap((day) =>
              rows
                .filter((r) => r.day_of_week === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-24 shrink-0 font-medium text-slate-900">
                        {DAY_LABEL[row.day_of_week]}
                      </span>
                      <span className="text-slate-600">
                        {fmtTime(row.start_time)} – {fmtTime(row.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{row.is_available ? 'Available' : 'Unavailable'}</span>
                        <Switch
                          checked={row.is_available}
                          onCheckedChange={(c) => onToggleAvailable(row, c)}
                          disabled={updateMutation.isPending}
                          aria-label={`Toggle availability for ${DAY_LABEL[row.day_of_week]} ${fmtTime(row.start_time)}`}
                        />
                      </label>
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
                )),
            )}
          </ul>
        )}
      </CardContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete availability window?"
        description={
          pendingDelete
            ? `${DAY_LABEL[pendingDelete.day_of_week]} ${fmtTime(pendingDelete.start_time)}–${fmtTime(pendingDelete.end_time)} will be removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
      />
    </Card>
  );
}
