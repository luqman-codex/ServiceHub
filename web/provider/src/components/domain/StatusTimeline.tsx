// src/components/domain/StatusTimeline.tsx (04 §A.2.9) — renders the booking (job)
// lifecycle from the per-transition timestamp columns (accepted_at / started_at /
// completed_at / cancelled_at). Each step shows whether it occurred and when.
import { Check, Circle, Clock, XCircle } from 'lucide-react';
import { DateTimeText } from './DateTimeText';
import type { BookingDTO } from '@/types/api';
import { cn } from '@/lib/utils/cn';

export interface StatusTimelineProps {
  booking: Pick<
    BookingDTO,
    'status' | 'created_at' | 'accepted_at' | 'started_at' | 'completed_at' | 'cancelled_at'
  >;
  className?: string;
}

interface TimelineStep {
  label: string;
  at: string | null;
  /** When true this is a terminal failure step (rejected/cancelled). */
  negative?: boolean;
}

export function StatusTimeline({ booking, className }: StatusTimelineProps) {
  const isRejected = booking.status === 'REJECTED';
  const terminalNegativeLabel = isRejected ? 'Rejected' : 'Cancelled';

  const steps: TimelineStep[] = [
    { label: 'Placed', at: booking.created_at },
    { label: 'Accepted', at: booking.accepted_at },
    { label: 'In progress', at: booking.started_at },
    { label: 'Completed', at: booking.completed_at },
  ];

  // The cancelled_at column also backs REJECTED (01 §5.2). Surface it as a final
  // negative step when present.
  if (booking.cancelled_at) {
    steps.push({ label: terminalNegativeLabel, at: booking.cancelled_at, negative: true });
  }

  return (
    <ol className={cn('space-y-4', className)}>
      {steps.map((step, idx) => {
        const done = Boolean(step.at);
        const isLast = idx === steps.length - 1;
        return (
          <li key={step.label} className="relative flex gap-3">
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-4px)] w-px',
                  done ? 'bg-slate-300' : 'bg-slate-200',
                )}
              />
            )}
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                step.negative
                  ? done
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-400'
                  : done
                    ? 'bg-green-100 text-green-600'
                    : 'bg-slate-100 text-slate-400',
              )}
            >
              {step.negative ? (
                <XCircle className="h-4 w-4" aria-hidden="true" />
              ) : done ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Circle className="h-3 w-3" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 pb-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  done ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {step.label}
              </p>
              {done ? (
                <DateTimeText
                  value={step.at}
                  format="datetime"
                  className="text-xs text-slate-500"
                />
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Pending
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
