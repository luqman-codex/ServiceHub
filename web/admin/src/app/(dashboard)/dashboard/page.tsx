'use client';

// src/app/(dashboard)/dashboard/page.tsx (04 §A.2.2, §8) — A-2 Dashboard.
// At-a-glance operational health: stat cards, status breakdown, booking volume, revenue,
// users-by-role. The summary query owns loading/empty/error/success; the volume chart owns
// its own independent query so one failure does not blank the page.
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  Activity,
  Users,
  UserCheck,
  Layers,
  Wrench,
} from 'lucide-react';
import { StatCard } from '@/components/data/StatCard';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { StatusBreakdownChart } from '@/components/data/StatusBreakdownChart';
import { BookingVolumeChart } from '@/components/data/BookingVolumeChart';
import { RoleBreakdownList } from '@/components/data/RoleBreakdownList';
import { RevenueCard } from '@/components/data/RevenueCard';
import { useAdminStats } from '@/lib/hooks/useAdminStats';

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Operational overview of bookings, users, catalog, and revenue.
        </p>
      </div>

      {/* Summary counts */}
      {isLoading ? (
        <LoadingState variant="cards" rows={4} />
      ) : isError ? (
        <ErrorState error={error} title="Unable to load dashboard" onRetry={() => refetch()} />
      ) : data ? (
        <>
          {/* Top-level totals */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total bookings"
              value={data.bookings.total}
              icon={CalendarClock}
              href="/bookings"
              accentClassName="bg-indigo-50 text-brand"
            />
            <StatCard
              label="Total users"
              value={data.users.total}
              icon={Users}
              href="/users"
              hint={`${data.users.active} active · ${data.users.inactive} inactive`}
              accentClassName="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Services"
              value={data.catalog.services}
              icon={Wrench}
              href="/services"
              hint={`${data.catalog.active_services} active`}
              accentClassName="bg-green-50 text-green-600"
            />
            <StatCard
              label="Categories"
              value={data.catalog.categories}
              icon={Layers}
              href="/categories"
              accentClassName="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Bookings-by-status mini cards (each → /bookings?status=<S>) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Pending"
              value={data.bookings.by_status.PENDING}
              icon={Clock}
              href="/bookings?status=PENDING"
              accentClassName="bg-amber-100 text-amber-800"
            />
            <StatCard
              label="Accepted"
              value={data.bookings.by_status.ACCEPTED}
              icon={CheckCircle2}
              href="/bookings?status=ACCEPTED"
              accentClassName="bg-blue-100 text-blue-800"
            />
            <StatCard
              label="In progress"
              value={data.bookings.by_status.IN_PROGRESS}
              icon={Activity}
              href="/bookings?status=IN_PROGRESS"
              accentClassName="bg-indigo-100 text-indigo-800"
            />
            <StatCard
              label="Completed"
              value={data.bookings.by_status.COMPLETED}
              icon={CheckCircle2}
              href="/bookings?status=COMPLETED"
              accentClassName="bg-green-100 text-green-800"
            />
            <StatCard
              label="Rejected"
              value={data.bookings.by_status.REJECTED}
              icon={Activity}
              href="/bookings?status=REJECTED"
              accentClassName="bg-red-100 text-red-800"
            />
            <StatCard
              label="Cancelled"
              value={data.bookings.by_status.CANCELLED}
              icon={Activity}
              href="/bookings?status=CANCELLED"
              accentClassName="bg-slate-100 text-slate-700"
            />
          </div>

          {/* Charts + breakdowns */}
          <div className="grid gap-6 lg:grid-cols-2">
            <StatusBreakdownChart byStatus={data.bookings.by_status} />
            <RoleBreakdownList byRole={data.users.by_role} />
          </div>

          <RevenueCard
            currency={data.revenue.currency}
            completedTotal={data.revenue.completed_total}
            paidTotal={data.revenue.paid_total}
          />
        </>
      ) : null}

      {/* Booking volume owns its own independent query (loading/empty/error/success). */}
      <BookingVolumeChart />
    </div>
  );
}
