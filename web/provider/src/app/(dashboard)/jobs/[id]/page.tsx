'use client';

// src/app/(dashboard)/jobs/[id]/page.tsx — provider job detail (P-1..P-9).
// Loads ONE job (server-scoped to this provider) with service, customer, and payment via
// useJob(id) (?include=service,customer,payment). Shows the details + timeline, and the
// JobActionPanel which renders only the legal transitions for the current status.
// Implements loading/empty/error/success.
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, StickyNote } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { BookingStatusBadge } from '@/components/domain/BookingStatusBadge';
import { MoneyText } from '@/components/domain/MoneyText';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { StatusTimeline } from '@/components/domain/StatusTimeline';
import { PaymentCard } from '@/components/domain/PaymentCard';
import { JobActionPanel } from '@/components/domain/JobActionPanel';
import { useJob } from '@/lib/hooks/useJobs';
import type { BookingDTO } from '@/types/api';

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{children}</span>
    </div>
  );
}

function JobDetailHeader({ booking }: { booking: BookingDTO }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Job #{booking.id}</h2>
        <BookingStatusBadge status={booking.status} />
      </div>
      <div className="text-sm text-slate-500">
        Placed <DateTimeText value={booking.created_at} format="relative" />
      </div>
    </div>
  );
}

function JobDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data: booking, isLoading, isError, error, refetch } = useJob(id);

  if (isLoading) {
    return <LoadingState variant="spinner" label="Loading job…" />;
  }
  if (isError) {
    return <ErrorState error={error} title="Unable to load job" onRetry={() => refetch()} />;
  }
  if (!booking) {
    return (
      <EmptyState
        title="Job not found"
        description="This job does not exist or is not assigned to you."
        action={
          <Button variant="outline" onClick={() => router.push('/jobs')}>
            Back to jobs
          </Button>
        }
      />
    );
  }

  const customer = booking.customer;
  const service = booking.service;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => router.push('/jobs')}
      >
        Back to jobs
      </Button>

      <JobDetailHeader booking={booking} />

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
                {customer ? `${customer.name} (#${customer.id})` : `#${booking.customer_id}`}
              </DetailRow>
              {customer?.phone && <DetailRow label="Customer phone">{customer.phone}</DetailRow>}
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

        {/* Right: actions + payment */}
        <div className="space-y-6">
          <JobActionPanel booking={booking} />
          <PaymentCard payment={booking.payment} />
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return (
    <AppShell title="Job detail">
      {Number.isFinite(id) ? (
        <JobDetail id={id} />
      ) : (
        <EmptyState title="Invalid job" description="The job id is not valid." />
      )}
    </AppShell>
  );
}
