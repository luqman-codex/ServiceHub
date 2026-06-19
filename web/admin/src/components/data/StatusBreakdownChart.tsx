'use client';

// src/components/data/StatusBreakdownChart.tsx (04 §8) — bookings-by-status breakdown.
// recharts pie; each segment click navigates to /bookings?status=<S>. Uses §7.3 colors.
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { EmptyState } from './EmptyState';
import type { BookingStatus } from '@/types/api';

// §7.3 status hex colors (matching the Tailwind status palette used by badges).
const STATUS_HEX: Record<BookingStatus, string> = {
  PENDING: '#d97706', // amber-600
  ACCEPTED: '#2563eb', // blue-600
  IN_PROGRESS: '#4f46e5', // indigo-600
  COMPLETED: '#16a34a', // green-600
  REJECTED: '#dc2626', // red-600
  CANCELLED: '#64748b', // slate-500
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const ORDER: BookingStatus[] = [
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
];

export interface StatusBreakdownChartProps {
  byStatus: Record<BookingStatus, number>;
  className?: string;
}

interface Slice {
  status: BookingStatus;
  name: string;
  value: number;
}

export function StatusBreakdownChart({ byStatus, className }: StatusBreakdownChartProps) {
  const router = useRouter();

  const data: Slice[] = ORDER.map((status) => ({
    status,
    name: STATUS_LABEL[status],
    value: byStatus[status] ?? 0,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bookings by status</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Status breakdown will appear once bookings are created."
            className="border-0"
          />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  onClick={(slice: unknown) => {
                    const s = slice as Slice | undefined;
                    if (s?.status) router.push(`/bookings?status=${s.status}`);
                  }}
                >
                  {data
                    .filter((d) => d.value > 0)
                    .map((d) => (
                      <Cell
                        key={d.status}
                        fill={STATUS_HEX[d.status]}
                        className="cursor-pointer outline-none"
                      />
                    ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => <span className="text-slate-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
