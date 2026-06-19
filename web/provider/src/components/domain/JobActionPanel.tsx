'use client';

// src/components/domain/JobActionPanel.tsx — the provider lifecycle controls for a single
// job, gated by the booking status lifecycle (02 §9 / 01 §5.3):
//   PENDING     → Accept / Reject (reason captured via ConfirmDialog)
//   ACCEPTED    → Start
//   IN_PROGRESS → Complete
//   REJECTED / COMPLETED / CANCELLED → terminal, no actions.
// Transitions run through the foundation useJobTransition() mutation, which writes the
// returned booking into the detail cache and invalidates the bookings lists. On success we
// toast; on error we surface the ApiError message (including 409 INVALID_STATUS_TRANSITION).
import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Play, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError } from '@/lib/api/errors';
import { useJobTransition, type JobAction } from '@/lib/hooks/useJobs';
import type { BookingDTO, BookingStatus } from '@/types/api';

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Which provider actions are legal from each status (02 §9 rows 32-35).
const ACTIONS_BY_STATUS: Record<BookingStatus, JobAction[]> = {
  PENDING: ['accept', 'reject'],
  ACCEPTED: ['start'],
  IN_PROGRESS: ['complete'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

const SUCCESS_MESSAGE: Record<JobAction, string> = {
  accept: 'Job accepted',
  reject: 'Job rejected',
  start: 'Job started',
  complete: 'Job completed',
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Something went wrong. Please try again.';
}

export interface JobActionPanelProps {
  booking: BookingDTO;
}

export function JobActionPanel({ booking }: JobActionPanelProps) {
  const transition = useJobTransition();
  const actions = ACTIONS_BY_STATUS[booking.status];

  // Reject is a destructive action with an optional reason → confirm via dialog.
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const run = (action: JobAction, reasonText?: string) => {
    transition.mutate(
      { id: booking.id, action, reason: reasonText },
      {
        onSuccess: () => {
          toast.success(SUCCESS_MESSAGE[action]);
          if (action === 'reject') {
            setRejectOpen(false);
            setReason('');
          }
        },
        onError: (err) => {
          toast.error(errorMessage(err));
        },
      },
    );
  };

  const isPending = transition.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Current status: {STATUS_LABEL[booking.status]}.</CardDescription>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <p className="text-sm text-slate-500">
            This job is in a terminal state ({STATUS_LABEL[booking.status]}). No further actions
            are available.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {actions.includes('accept') && (
              <Button
                fullWidth
                leftIcon={<Check className="h-4 w-4" />}
                isLoading={isPending}
                onClick={() => run('accept')}
              >
                Accept job
              </Button>
            )}

            {actions.includes('reject') && (
              <Button
                fullWidth
                variant="danger"
                leftIcon={<X className="h-4 w-4" />}
                disabled={isPending}
                onClick={() => setRejectOpen(true)}
              >
                Reject job
              </Button>
            )}

            {actions.includes('start') && (
              <Button
                fullWidth
                leftIcon={<Play className="h-4 w-4" />}
                isLoading={isPending}
                onClick={() => run('start')}
              >
                Start job
              </Button>
            )}

            {actions.includes('complete') && (
              <Button
                fullWidth
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                isLoading={isPending}
                onClick={() => run('complete')}
              >
                Complete job
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Reject confirmation with an optional reason. */}
      <Dialog
        open={rejectOpen}
        onClose={() => {
          if (!isPending) {
            setRejectOpen(false);
            setReason('');
          }
        }}
        title={`Reject job #${booking.id}?`}
        description="Optionally tell the customer why you are rejecting this job. This cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false);
                setReason('');
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={isPending}
              onClick={() => run('reject', reason.trim() === '' ? undefined : reason.trim())}
            >
              Reject job
            </Button>
          </>
        }
      >
        <div className="space-y-1.5">
          <label htmlFor="reject-reason" className="block text-sm font-medium text-slate-700">
            Reason (optional)
          </label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Outside my service area"
            maxLength={2000}
          />
        </div>
      </Dialog>
    </Card>
  );
}
