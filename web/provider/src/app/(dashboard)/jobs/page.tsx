'use client';

// src/app/(dashboard)/jobs/page.tsx — the provider's job queue (P-1..P-9).
// Server-scoped GET /bookings returns only this provider's assigned jobs. Filter by status,
// sort, paginate; click a row to open the detail. Implements loading/empty/error/success.
// The initial status filter is seeded from the ?status= query param (dashboard deep-links).
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn, type SortOrder } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState } from '@/components/data/LoadingState';
import { BookingStatusBadge } from '@/components/domain/BookingStatusBadge';
import { MoneyText } from '@/components/domain/MoneyText';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { useJobs } from '@/lib/hooks/useJobs';
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

const VALID_STATUSES = new Set<BookingStatus>([
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
]);

function JobsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Seed the status filter from ?status= (e.g. dashboard deep-links).
  const initialStatusParam = searchParams.get('status');
  const initialStatus: '' | BookingStatus =
    initialStatusParam && VALID_STATUSES.has(initialStatusParam as BookingStatus)
      ? (initialStatusParam as BookingStatus)
      : '';

  const [status, setStatus] = useState<'' | BookingStatus>(initialStatus);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<BookingSortBy>('scheduled_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Keep the filter in sync if the user navigates back to /jobs?status=… via a new link.
  useEffect(() => {
    setStatus(initialStatus);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatusParam]);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      sort_by: sortBy,
      sort_order: sortOrder,
      status: status === '' ? undefined : status,
    }),
    [page, sortBy, sortOrder, status],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useJobs(queryParams);

  const handleSortChange = (nextSortBy: string, nextOrder: SortOrder) => {
    setSortBy(nextSortBy as BookingSortBy);
    setSortOrder(nextOrder);
    setPage(1);
  };

  const onStatusChange = (next: '' | BookingStatus) => {
    setStatus(next);
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
      key: 'service',
      header: 'Service',
      cell: (b) => b.service?.name ?? `#${b.service_id}`,
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (b) => b.customer?.name ?? `#${b.customer_id}`,
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
              value={status}
              onChange={(e) => onStatusChange(e.target.value as '' | BookingStatus)}
              options={STATUS_OPTIONS}
            />
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
        onRowClick={(b) => router.push(`/jobs/${b.id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        emptyTitle="No jobs found."
        emptyDescription={
          status === ''
            ? 'You have no assigned jobs yet.'
            : 'No jobs match the selected status filter.'
        }
        emptyAction={
          status !== '' ? (
            <Button variant="outline" onClick={() => onStatusChange('')}>
              Clear filter
            </Button>
          ) : undefined
        }
      />

      <Pagination meta={data?.meta} onPageChange={setPage} />

      <p className="sr-only" role="status" aria-live="polite">
        {isFetching ? 'Updating results…' : 'Results updated.'}
      </p>
    </div>
  );
}

export default function JobsPage() {
  return (
    <AppShell title="Jobs">
      <Suspense fallback={<LoadingState variant="table" rows={6} columns={6} />}>
        <JobsList />
      </Suspense>
    </AppShell>
  );
}
