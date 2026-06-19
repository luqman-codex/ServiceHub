// src/components/domain/BookingStatusBadge.tsx (04 §7.3) — booking status pill.
// Uses the canonical status → Tailwind color mapping from §7.3 verbatim.
import { Badge } from '@/components/ui/Badge';
import type { BookingStatus } from '@/types/api';

const STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-slate-100 text-slate-700',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  return (
    <Badge colorClassName={STATUS_COLOR[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
