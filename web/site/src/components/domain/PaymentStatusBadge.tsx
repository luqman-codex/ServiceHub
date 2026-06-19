// src/components/domain/PaymentStatusBadge.tsx (04 §A.2.11) — payment status pill.
// PENDING|PAID|FAILED|REFUNDED with accessible text + color.
import { Badge } from '@/components/ui/Badge';
import type { PaymentStatus } from '@/types/api';

const STATUS_COLOR: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-slate-100 text-slate-700',
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <Badge colorClassName={STATUS_COLOR[status]} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
