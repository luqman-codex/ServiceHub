'use client';

// src/app/(account)/bookings/page.tsx (04 §B.2.8, C-7) — the customer's own booking
// history. GET /bookings?include=service&sort_by=scheduled_at&sort_order=desc (the server
// scopes results to customer_id = self). Filter by status; tap a card → /bookings/:id.
// States: card skeletons / "no bookings yet" CTA / retry / list.
import { useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, ChevronRight } from 'lucide-react';
import { useBookings } from '@/lib/hooks/useBookings';
import type { BookingListParams } from '@/lib/api/bookings';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { BookingStatusBadge } from '@/components/domain/BookingStatusBadge';
import { MoneyText } from '@/components/domain/MoneyText';
import { DateTimeText } from '@/components/domain/DateTimeText';
import type { BookingDTO, BookingStatus } from '@/types/api';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { label: string; value: '' | BookingStatus }[] = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'In progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function BookingRow({ booking }: { booking: BookingDTO }) {
  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <Card className="transition-colors hover:border-brand/50 hover:bg-slate-50">
        <CardContent className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {booking.service?.name ?? `Service #${booking.service_id}`}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              <DateTimeText value={booking.scheduled_at} format="datetime" />
            </p>
          </div>
          <div className="shrink-0 text-right">
            <BookingStatusBadge status={booking.status} />
            <p className="mt-1 text-sm font-medium text-slate-900">
              <MoneyText amount={booking.total_price} currency={booking.currency} />
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function BookingsHistoryPage() {
  const [status, setStatus] = useState<'' | BookingStatus>('');
  const [page, setPage] = useState(1);

  const params: BookingListParams = {
    page,
    page_size: PAGE_SIZE,
    sort_by: 'scheduled_at',
    sort_order: 'desc',
    status: status || undefined,
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useBookings(params);

  const items = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900">My bookings</h1>
        <div className="w-full sm:w-56">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <Select
            id="status-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as '' | BookingStatus);
              setPage(1);
            }}
            options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState variant="lines" rows={5} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} title="Unable to load bookings" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="You have no bookings yet"
          description={
            status
              ? 'No bookings match this status filter.'
              : 'Browse services and make your first booking.'
          }
          action={
            <Link href="/services">
              <Button>Browse services</Button>
            </Link>
          }
        />
      ) : (
        <div
          className="space-y-3"
          aria-busy={isFetching || undefined}
        >
          {items.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </div>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} />
    </div>
  );
}
