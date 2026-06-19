'use client';

// src/app/(dashboard)/bookings/[id]/page.tsx (04 §A.2.9, A-8/A-9/A-11) — Booking detail.
// Inspect one booking; apply any legal status transition; assign/reassign/unassign a
// provider; view the mocked payment. Implements loading/empty/error/success.
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, StickyNote } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { BookingStatusBadge } from '@/components/domain/BookingStatusBadge';
import { MoneyText } from '@/components/domain/MoneyText';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { RoleBadge } from '@/components/domain/RoleBadge';
import { StatusTimeline } from '@/components/domain/StatusTimeline';
import { StatusTransitionPanel } from '@/components/domain/StatusTransitionPanel';
import { PaymentCard } from '@/components/domain/PaymentCard';
import {
  useActiveProviders,
  useBooking,
  useBookingPayment,
} from '@/lib/hooks/useBookings';
import type { BookingDTO } from '@/types/api';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{children}</span>
    </div>
  );
}

function BookingDetailHeader({ booking }: { booking: BookingDTO }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Booking #{booking.id}</h2>
        <BookingStatusBadge status={booking.status} />
      </div>
      <div className="text-sm text-slate-500">
        Placed <DateTimeText value={booking.created_at} format="relative" />
      </div>
    </div>
  );
}

function BookingDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data: booking, isLoading, isError, error, refetch } = useBooking(id);
  const payment = useBookingPayment(id);
  const providers = useActiveProviders();

  if (isLoading) {
    return <LoadingState variant="spinner" label="Loading booking…" />;
  }
  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }
  if (!booking) {
    return (
      <EmptyState
        title="Booking not found"
        description="This booking does not exist or has been removed."
        action={
          <Button variant="outline" onClick={() => router.push('/bookings')}>
            Back to bookings
          </Button>
        }
      />
    );
  }

  const customer = booking.customer;
  const service = booking.service;
  const provider = booking.provider;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => router.push('/bookings')}
      >
        Back to bookings
      </Button>

      <BookingDetailHeader booking={booking} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: details + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              <DetailRow label="Service">
                {service ? `${service.name} (#${service.id})` : `#${booking.service_id}`}
              </DetailRow>
              <DetailRow label="Customer">
                {customer ? (
                  <span className="inline-flex items-center gap-2">
                    {customer.name} (#{customer.id})
                    <RoleBadge role={customer.role} />
                  </span>
                ) : (
                  `#${booking.customer_id}`
                )}
              </DetailRow>
              <DetailRow label="Provider">
                {provider ? (
                  <span className="inline-flex items-center gap-2">
                    {provider.name} (#{provider.id})
                    <RoleBadge role={provider.role} />
                  </span>
                ) : booking.provider_id != null ? (
                  `#${booking.provider_id}`
                ) : (
                  <span className="text-slate-400">Unassigned</span>
                )}
              </DetailRow>
              <DetailRow label="Scheduled">
                <DateTimeText value={booking.scheduled_at} format="datetime" />
              </DetailRow>
              <DetailRow label="Total">
                <MoneyText amount={booking.total_price} currency={booking.currency} />
              </DetailRow>
              <DetailRow label="Address">
                {booking.address ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {booking.address}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </DetailRow>
              <DetailRow label="Notes">
                {booking.notes ? (
                  <span className="inline-flex items-center gap-1.5">
                    <StickyNote className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {booking.notes}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </DetailRow>
              {booking.cancellation_reason && (
                <DetailRow label="Cancellation reason">
                  {booking.cancellation_reason}
                </DetailRow>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline booking={booking} />
            </CardContent>
          </Card>
        </div>

        {/* Right: controls + payment */}
        <div className="space-y-6">
          <StatusTransitionPanel
            booking={booking}
            providers={providers.data?.items ?? []}
            providersLoading={providers.isLoading}
          />
          <PaymentCard
            payment={payment.data}
            isLoading={payment.isLoading}
            isError={payment.isError}
            error={payment.error}
            onRetry={() => payment.refetch()}
          />
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell title="Booking detail">
        {Number.isFinite(id) ? (
          <BookingDetail id={id} />
        ) : (
          <EmptyState title="Invalid booking" description="The booking id is not valid." />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
