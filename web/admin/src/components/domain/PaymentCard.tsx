'use client';

// src/components/domain/PaymentCard.tsx (04 §A.2.9, §A.2.11) — read-only view of the
// mocked payment for a booking (GET /bookings/:id/payment). Implements the four UI
// states; a 404 ApiError is treated as the "No payment recorded" empty state.
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { MoneyText } from './MoneyText';
import { DateTimeText } from './DateTimeText';
import { ApiError } from '@/lib/api/errors';
import type { PaymentDTO } from '@/types/api';

export interface PaymentCardProps {
  payment: PaymentDTO | undefined;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

const METHOD_LABEL: Record<PaymentDTO['method'], string> = {
  CARD: 'Card',
  CASH: 'Cash',
  WALLET: 'Wallet',
  MOCK: 'Mock',
};

export function PaymentCard({ payment, isLoading, isError, error, onRetry }: PaymentCardProps) {
  const isNotFound = error instanceof ApiError && error.status === 404;

  let body: React.ReactNode;
  if (isLoading) {
    body = <LoadingState variant="lines" rows={4} />;
  } else if (isError && !isNotFound) {
    body = <ErrorState error={error} onRetry={onRetry} title="Unable to load payment" />;
  } else if (!payment || isNotFound) {
    body = (
      <EmptyState
        icon={CreditCard}
        title="No payment recorded"
        description="This booking has no mocked payment yet."
      />
    );
  } else {
    body = (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <dt className="text-slate-500">Status</dt>
        <dd className="text-right">
          <PaymentStatusBadge status={payment.status} />
        </dd>

        <dt className="text-slate-500">Amount</dt>
        <dd className="text-right font-medium text-slate-900">
          <MoneyText amount={payment.amount} currency={payment.currency} />
        </dd>

        <dt className="text-slate-500">Method</dt>
        <dd className="text-right text-slate-900">{METHOD_LABEL[payment.method]}</dd>

        <dt className="text-slate-500">Transaction ref</dt>
        <dd className="text-right text-slate-900">{payment.transaction_ref ?? '—'}</dd>

        <dt className="text-slate-500">Paid at</dt>
        <dd className="text-right text-slate-900">
          {payment.paid_at ? <DateTimeText value={payment.paid_at} format="datetime" /> : '—'}
        </dd>
      </dl>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Payment
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
