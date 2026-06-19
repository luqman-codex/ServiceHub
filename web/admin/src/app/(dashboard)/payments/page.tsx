'use client';

// src/app/(dashboard)/payments/page.tsx (A-11, 04 §A.2.11) — Payments list.
// Admin-only inspection of mocked payment records across bookings.
// GET /payments?status=&method=&booking_id=&sort_by=&sort_order=&page=&page_size=
// Filter by status/method/booking; click a row → linked booking /bookings/:booking_id.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn, type SortOrder } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { PaymentStatusBadge } from '@/components/domain/PaymentStatusBadge';
import { MoneyText } from '@/components/domain/MoneyText';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { usePayments } from '@/lib/hooks/usePayments';
import type { ListPaymentsParams, PaymentSortBy } from '@/lib/api/payments';
import type { PaymentDTO, PaymentMethod, PaymentStatus } from '@/types/api';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { label: string; value: '' | PaymentStatus }[] = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

const METHOD_OPTIONS: { label: string; value: '' | PaymentMethod }[] = [
  { label: 'All methods', value: '' },
  { label: 'Card', value: 'CARD' },
  { label: 'Cash', value: 'CASH' },
  { label: 'Wallet', value: 'WALLET' },
  { label: 'Mock', value: 'MOCK' },
];

const METHOD_COLOR: Record<PaymentMethod, 'blue' | 'green' | 'purple' | 'slate'> = {
  CARD: 'blue',
  CASH: 'green',
  WALLET: 'purple',
  MOCK: 'slate',
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CARD: 'Card',
  CASH: 'Cash',
  WALLET: 'Wallet',
  MOCK: 'Mock',
};

function MethodBadge({ method }: { method: PaymentMethod }) {
  return <Badge color={METHOD_COLOR[method]}>{METHOD_LABEL[method]}</Badge>;
}

function PaymentsScreen() {
  const router = useRouter();

  const [status, setStatus] = useState<'' | PaymentStatus>('');
  const [method, setMethod] = useState<'' | PaymentMethod>('');
  const [bookingId, setBookingId] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<PaymentSortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const parsedBookingId = useMemo(() => {
    const n = Number(bookingId);
    return bookingId.trim() !== '' && Number.isInteger(n) && n > 0 ? n : undefined;
  }, [bookingId]);

  const params: ListPaymentsParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      sort_by: sortBy,
      sort_order: sortOrder,
      status: status || undefined,
      method: method || undefined,
      booking_id: parsedBookingId,
    }),
    [page, sortBy, sortOrder, status, method, parsedBookingId],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = usePayments(params);

  const columns: DataTableColumn<PaymentDTO>[] = [
    {
      key: 'id',
      header: 'ID',
      sortKey: 'id',
      cell: (p) => <span className="font-medium text-slate-900">#{p.id}</span>,
    },
    {
      key: 'booking',
      header: 'Booking',
      cell: (p) => <span className="text-brand">#{p.booking_id}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (p) => <MoneyText amount={p.amount} currency={p.currency} />,
    },
    {
      key: 'method',
      header: 'Method',
      cell: (p) => <MethodBadge method={p.method} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => <PaymentStatusBadge status={p.status} />,
    },
    {
      key: 'transaction_ref',
      header: 'Reference',
      cell: (p) =>
        p.transaction_ref ? (
          <span className="font-mono text-xs text-slate-600">{p.transaction_ref}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'paid_at',
      header: 'Paid at',
      sortKey: 'paid_at',
      cell: (p) =>
        p.paid_at ? (
          <DateTimeText value={p.paid_at} format="datetime" className="text-slate-600" />
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortKey: 'created_at',
      cell: (p) => (
        <DateTimeText value={p.created_at} format="datetime" className="text-slate-600" />
      ),
    },
  ];

  const handleSortChange = (nextSortBy: string, nextOrder: SortOrder) => {
    setSortBy(nextSortBy as PaymentSortBy);
    setSortOrder(nextOrder);
    setPage(1);
  };

  const resetFilters = () => {
    setStatus('');
    setMethod('');
    setBookingId('');
    setPage(1);
  };

  const hasFilters = status !== '' || method !== '' || bookingId.trim() !== '';

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | PaymentStatus);
                setPage(1);
              }}
              options={STATUS_OPTIONS}
              className="sm:w-44"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Method</label>
            <Select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value as '' | PaymentMethod);
                setPage(1);
              }}
              options={METHOD_OPTIONS}
              className="sm:w-44"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Booking ID</label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 42"
              value={bookingId}
              onChange={(e) => {
                setBookingId(e.target.value);
                setPage(1);
              }}
              className="sm:w-44"
            />
          </div>

          {hasFilters && (
            <Button variant="ghost" onClick={resetFilters} className="sm:ml-auto">
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        onRowClick={(p) => router.push(`/bookings/${p.booking_id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        emptyTitle="No payments recorded yet."
        emptyDescription={
          hasFilters ? 'Try clearing the filters to see all payments.' : undefined
        }
        className={isFetching ? 'opacity-60 transition-opacity' : undefined}
      />

      <Pagination meta={data?.meta} onPageChange={setPage} />
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell
        title={
          <span className="inline-flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-400" aria-hidden="true" />
            Payments
          </span>
        }
      >
        <PaymentsScreen />
      </AppShell>
    </ProtectedRoute>
  );
}
