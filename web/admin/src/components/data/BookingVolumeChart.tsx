'use client';

// src/components/data/BookingVolumeChart.tsx (04 §8) — booking volume over time.
// recharts line chart fed by GET /admin/stats/bookings buckets; owns its own query so
// a failure degrades to a card-level error + retry. group_by control refetches on change.
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { useAdminStatsBookings } from '@/lib/hooks/useAdminStats';
import type { StatsGroupBy } from '@/lib/api/admin';

const GROUP_OPTIONS: { label: string; value: StatsGroupBy }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

export interface BookingVolumeChartProps {
  className?: string;
}

export function BookingVolumeChart({ className }: BookingVolumeChartProps) {
  const [groupBy, setGroupBy] = useState<StatsGroupBy>('day');
  const { data, isLoading, isError, error, refetch } = useAdminStatsBookings({ group_by: groupBy });

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Booking volume</CardTitle>
        <div className="w-32">
          <Select
            aria-label="Group by"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as StatsGroupBy)}
            options={GROUP_OPTIONS}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          {isLoading ? (
            <LoadingState variant="spinner" label="Loading volume…" />
          ) : isError ? (
            <ErrorState error={error} title="Unable to load volume" onRetry={() => refetch()} />
          ) : !data || data.buckets.length === 0 ? (
            <EmptyState
              title="No data in range"
              description="No bookings were created in the selected period."
              className="border-0"
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.buckets} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                  labelStyle={{ color: '#0f172a' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Bookings"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#4f46e5' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
