'use client';

// src/app/(dashboard)/bookings/page.tsx (04 §A.2.8, A-7) — All Bookings.
// Filter by status / service / customer / provider / scheduled date range; sort;
// paginate; click a row to open the detail. Implements loading/empty/error/success.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn, type SortOrder } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { BookingStatusBadge } from '@/components/domain/BookingStatusBadge';
import { MoneyText } from '@/components/domain/MoneyText';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { useBookings } from '@/lib/hooks/useBookings';
import type { BookingSortBy } from '@/lib/api/bookings';
import type { BookingDTO, BookingStatus } from '@/types/api';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { label: string; value: '' | BookingStatus }[] = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

interface Filters {
  status: '' | BookingStatus;
  service_id: string;
  customer_id: string;
  provider_id: string;
  scheduled_from: string;
  scheduled_to: string;
}

const EMPTY_FILTERS: Filters = {
  status: '',
  service_id: '',
  customer_id: '',
  provider_id: '',
  scheduled_from: '',
  scheduled_to: '',
};

function toIdNumber(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// Convert a yyyy-MM-dd input to an ISO-8601 UTC string for the range filter.
function dateToIso(v: string, endOfDay = false): string | undefined {
  if (!v) return undefined;
  return endOfDay ? `${v}T23:59:59.999Z` : `${v}T00:00:00.000Z`;
}

function BookingsList() {
  const router = useRouter();

  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<BookingSortBy>('scheduled_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      sort_by: sortBy,
      sort_order: sortOrder,
      status: applied.status === '' ? undefined : applied.status,
      service_id: toIdNumber(applied.service_id),
      customer_id: toIdNumber(applied.customer_id),
      provider_id: toIdNumber(applied.provider_id),
      scheduled_from: dateToIso(applied.scheduled_from),
      scheduled_to: dateToIso(applied.scheduled_to, true),
    }),
    [page, sortBy, sortOrder, applied],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useBookings(queryParams);

  const applyFilters = () => {
    setApplied(draft);
    setPage(1);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const handleSortChange = (nextSortBy: string, nextOrder: SortOrder) => {
    setSortBy(nextSortBy as BookingSortBy);
    setSortOrder(nextOrder);
    setPage(1);
  };

  const columns: DataTableColumn<BookingDTO>[] = [
    {
      key: 'id',
      header: 'ID',
      sortKey: 'id',
      cell: (b) => <span className="font-medium text-slate-900">#{b.id}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (b) => b.customer?.name ?? `#${b.customer_id}`,
    },
    {
      key: 'service',
      header: 'Service',
      cell: (b) => b.service?.name ?? `#${b.service_id}`,
    },
    {
      key: 'provider',
      header: 'Provider',
      cell: (b) =>
        b.provider?.name ?? (b.provider_id != null ? `#${b.provider_id}` : (
          <span className="text-slate-400">Unassigned</span>
        )),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (b) => <BookingStatusBadge status={b.status} />,
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      sortKey: 'scheduled_at',
      cell: (b) => <DateTimeText value={b.scheduled_at} format="datetime" />,
    },
    {
      key: 'total_price',
      header: 'Total',
      align: 'right',
      cell: (b) => <MoneyText amount={b.total_price} currency={b.currency} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <Select
              value={draft.status}
              onChange={(e) =>
                setDraft((f) => ({ ...f, status: e.target.value as '' | BookingStatus }))
              }
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Service ID</label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 3"
              value={draft.service_id}
              onChange={(e) => setDraft((f) => ({ ...f, service_id: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Customer ID</label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 12"
              value={draft.customer_id}
              onChange={(e) => setDraft((f) => ({ ...f, customer_id: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Provider ID</label>
            <Input
              inputMode="numeric"
              placeholder="e.g. 8"
              value={draft.provider_id}
              onChange={(e) => setDraft((f) => ({ ...f, provider_id: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Scheduled from</label>
            <Input
              type="date"
              value={draft.scheduled_from}
              onChange={(e) => setDraft((f) => ({ ...f, scheduled_from: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Scheduled to</label>
            <Input
              type="date"
              value={draft.scheduled_to}
              onChange={(e) => setDraft((f) => ({ ...f, scheduled_to: e.target.value }))}
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button onClick={applyFilters}>Apply filters</Button>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table (loading / empty / error / success) */}
      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(b) => b.id}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(b) => router.push(`/bookings/${b.id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        emptyTitle="No bookings match your filters."
        emptyDescription="Try adjusting or clearing the filters above."
        emptyAction={
          <Button variant="outline" onClick={resetFilters}>
            Clear filters
          </Button>
        }
      />

      <Pagination meta={data?.meta} onPageChange={setPage} />

      <p className="sr-only" role="status" aria-live="polite">
        {isFetching ? 'Updating results…' : 'Results updated.'}
      </p>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell title="Bookings">
        <BookingsList />
      </AppShell>
    </ProtectedRoute>
  );
}
