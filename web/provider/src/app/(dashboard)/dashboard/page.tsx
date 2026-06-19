'use client';

// src/app/(dashboard)/dashboard/page.tsx — PROVIDER dashboard (P-1..P-9 overview).
// There is no provider-stats endpoint, so we derive MY job counts by status from a single
// high-page-size useJobs() fetch (server scopes to this provider's assigned jobs), then
// surface today's jobs and upcoming jobs. The single query owns loading/empty/error/success.
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  Activity,
  XCircle,
  Ban,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/data/StatCard';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { BookingStatusBadge } from '@/components/domain/BookingStatusBadge';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { MoneyText } from '@/components/domain/MoneyText';
import { useJobs } from '@/lib/hooks/useJobs';
import type { BookingDTO, BookingStatus } from '@/types/api';

// Pull a large window of the provider's jobs in one request so we can compute counts
// client-side (page_size is clamped to 100 server-side per 02 §7.1).
const DASHBOARD_PAGE_SIZE = 100;

const EMPTY_COUNTS: Record<BookingStatus, number> = {
  PENDING: 0,
  ACCEPTED: 0,
  REJECTED: 0,
  IN_PROGRESS: 0,
  COMPLETED: 0,
  CANCELLED: 0,
};

function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function JobRow({ job, onClick }: { job: BookingDTO; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {job.service?.name ?? `Service #${job.service_id}`}{' '}
          <span className="font-normal text-slate-400">· #{job.id}</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {job.customer?.name ?? `Customer #${job.customer_id}`} ·{' '}
          <DateTimeText value={job.scheduled_at} format="datetime" />
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <MoneyText amount={job.total_price} currency={job.currency} className="text-sm text-slate-700" />
        <BookingStatusBadge status={job.status} />
      </div>
    </button>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useJobs({
    page: 1,
    page_size: DASHBOARD_PAGE_SIZE,
    sort_by: 'scheduled_at',
    sort_order: 'asc',
  });

  const jobs = data?.items;

  const counts = useMemo(() => {
    const acc: Record<BookingStatus, number> = { ...EMPTY_COUNTS };
    for (const j of jobs ?? []) acc[j.status] += 1;
    return acc;
  }, [jobs]);

  const { todayJobs, upcomingJobs } = useMemo(() => {
    const now = new Date();
    const active = (jobs ?? []).filter(
      (j) => j.status === 'PENDING' || j.status === 'ACCEPTED' || j.status === 'IN_PROGRESS',
    );
    const today = active.filter((j) => isSameLocalDay(j.scheduled_at, now));
    const upcoming = active
      .filter((j) => new Date(j.scheduled_at).getTime() >= now.getTime() && !isSameLocalDay(j.scheduled_at, now))
      .slice(0, 6);
    return { todayJobs: today, upcomingJobs: upcoming };
  }, [jobs]);

  if (isLoading) {
    return <LoadingState variant="cards" rows={4} />;
  }
  if (isError) {
    return <ErrorState error={error} title="Unable to load your dashboard" onRetry={() => refetch()} />;
  }

  const total = data?.meta.total_items ?? 0;

  return (
    <div className="space-y-6">
      {/* Status breakdown for MY jobs (each → /jobs?status=<S>). */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Pending"
          value={counts.PENDING}
          icon={Clock}
          href="/jobs?status=PENDING"
          accentClassName="bg-amber-100 text-amber-800"
        />
        <StatCard
          label="Accepted"
          value={counts.ACCEPTED}
          icon={CheckCircle2}
          href="/jobs?status=ACCEPTED"
          accentClassName="bg-blue-100 text-blue-800"
        />
        <StatCard
          label="In progress"
          value={counts.IN_PROGRESS}
          icon={Activity}
          href="/jobs?status=IN_PROGRESS"
          accentClassName="bg-indigo-100 text-indigo-800"
        />
        <StatCard
          label="Completed"
          value={counts.COMPLETED}
          icon={CheckCircle2}
          href="/jobs?status=COMPLETED"
          accentClassName="bg-green-100 text-green-800"
        />
        <StatCard
          label="Rejected"
          value={counts.REJECTED}
          icon={XCircle}
          href="/jobs?status=REJECTED"
          accentClassName="bg-red-100 text-red-800"
        />
        <StatCard
          label="Cancelled"
          value={counts.CANCELLED}
          icon={Ban}
          href="/jobs?status=CANCELLED"
          accentClassName="bg-slate-100 text-slate-700"
        />
      </div>

      {total > DASHBOARD_PAGE_SIZE && (
        <p className="text-xs text-slate-400">
          Showing breakdown for your {DASHBOARD_PAGE_SIZE} most recent jobs of {total} total.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {todayJobs.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No jobs scheduled for today"
                description="Accepted and pending jobs scheduled for today will appear here."
              />
            ) : (
              <div className="space-y-2">
                {todayJobs.map((j) => (
                  <JobRow key={j.id} job={j} onClick={() => router.push(`/jobs/${j.id}`)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingJobs.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing upcoming"
                description="Future pending and accepted jobs will appear here."
                action={
                  <Button variant="outline" onClick={() => router.push('/jobs')}>
                    View all jobs
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {upcomingJobs.map((j) => (
                  <JobRow key={j.id} job={j} onClick={() => router.push(`/jobs/${j.id}`)} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your assigned jobs at a glance — counts by status and what&apos;s coming up.
          </p>
        </div>
        <DashboardContent />
      </div>
    </AppShell>
  );
}
