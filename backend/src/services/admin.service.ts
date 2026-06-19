import { fn, col, literal, Op, WhereOptions } from 'sequelize';
import {
  Booking,
  Category,
  Payment,
  Role,
  Service,
  User,
} from '../models';
import { BookingStatus, PaymentStatus, RoleName } from '../types/enums';
import { GroupBy } from '../validators/admin.validator';

/**
 * Admin Dashboard & Stats service (02 §8.8, 03 §13 rows 44–45).
 *
 * All business logic lives here. Authorization to `ADMIN` is enforced at the
 * route layer (`authorize(ADMIN)`); there is no per-row ownership concept for
 * these aggregate endpoints, so no ownership guard is needed.
 */

/** Shape returned by `getStats` (02 §8.8 — GET /admin/stats). */
export interface AdminStatsDTO {
  users: {
    total: number;
    by_role: Record<RoleName, number>;
    active: number;
    inactive: number;
  };
  bookings: {
    total: number;
    by_status: Record<BookingStatus, number>;
  };
  catalog: {
    categories: number;
    services: number;
    active_services: number;
  };
  revenue: {
    currency: string;
    completed_total: string;
    paid_total: string;
  };
}

/** Shape returned by `getBookingStats` (02 §8.8 — GET /admin/stats/bookings). */
export interface BookingStatsBucketDTO {
  bucket: string;
  count: number;
}

export interface BookingStatsDTO {
  group_by: GroupBy;
  from: string;
  to: string;
  buckets: BookingStatsBucketDTO[];
}

/** Default reporting currency for the revenue rollup (matches seed data). */
const DEFAULT_CURRENCY = 'USD';

/** DECIMAL → fixed 2-decimal string (e.g. "49.99"); SUM returns null when empty. */
function toDecimalString(value: unknown): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

function emptyRoleCounts(): Record<RoleName, number> {
  return {
    [RoleName.CUSTOMER]: 0,
    [RoleName.PROVIDER]: 0,
    [RoleName.ADMIN]: 0,
  };
}

function emptyStatusCounts(): Record<BookingStatus, number> {
  return {
    [BookingStatus.PENDING]: 0,
    [BookingStatus.ACCEPTED]: 0,
    [BookingStatus.REJECTED]: 0,
    [BookingStatus.IN_PROGRESS]: 0,
    [BookingStatus.COMPLETED]: 0,
    [BookingStatus.CANCELLED]: 0,
  };
}

/**
 * GET /admin/stats — dashboard summary counts.
 *
 * Aggregates: total users + users grouped by role (+ active/inactive),
 * total bookings + bookings grouped by status, catalog counts
 * (categories, services, active services), and revenue from completed
 * bookings / paid payments.
 */
export async function getStats(): Promise<AdminStatsDTO> {
  const [
    totalUsers,
    activeUsers,
    usersByRoleRows,
    totalBookings,
    bookingsByStatusRows,
    totalCategories,
    totalServices,
    activeServices,
    completedRevenueRow,
    paidRevenueRow,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { is_active: true } }),
    User.findAll({
      attributes: [
        [col('role.name'), 'role_name'],
        [fn('COUNT', col('User.id')), 'count'],
      ],
      include: [{ model: Role, as: 'role', attributes: [] }],
      group: ['role.name'],
      raw: true,
    }) as unknown as Promise<Array<{ role_name: RoleName; count: number }>>,
    Booking.count(),
    Booking.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }) as unknown as Promise<Array<{ status: BookingStatus; count: number }>>,
    Category.count(),
    Service.count(),
    Service.count({ where: { is_active: true } }),
    Booking.findOne({
      attributes: [[fn('SUM', col('total_price')), 'total']],
      where: { status: BookingStatus.COMPLETED },
      raw: true,
    }) as unknown as Promise<{ total: string | null } | null>,
    Payment.findOne({
      attributes: [[fn('SUM', col('amount')), 'total']],
      where: { status: PaymentStatus.PAID },
      raw: true,
    }) as unknown as Promise<{ total: string | null } | null>,
  ]);

  const byRole = emptyRoleCounts();
  for (const row of usersByRoleRows) {
    if (row.role_name in byRole) byRole[row.role_name] = Number(row.count);
  }

  const byStatus = emptyStatusCounts();
  for (const row of bookingsByStatusRows) {
    if (row.status in byStatus) byStatus[row.status] = Number(row.count);
  }

  return {
    users: {
      total: totalUsers,
      by_role: byRole,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    },
    bookings: {
      total: totalBookings,
      by_status: byStatus,
    },
    catalog: {
      categories: totalCategories,
      services: totalServices,
      active_services: activeServices,
    },
    revenue: {
      currency: DEFAULT_CURRENCY,
      completed_total: toDecimalString(completedRevenueRow?.total),
      paid_total: toDecimalString(paidRevenueRow?.total),
    },
  };
}

/** Map a `group_by` to the MySQL DATE_FORMAT mask producing the bucket label. */
const BUCKET_FORMAT: Record<GroupBy, string> = {
  // ISO calendar date for a day bucket, e.g. 2026-06-19
  day: '%Y-%m-%d',
  // ISO-year + ISO-week (mode 3), e.g. 2026-25
  week: '%x-%v',
  // year + month, e.g. 2026-06
  month: '%Y-%m',
};

/**
 * GET /admin/stats/bookings — booking volume over time, bucketed by day/week/month.
 *
 * Counts bookings by `created_at` falling within [from, to]. When `from`/`to`
 * are omitted they default to the last 30 days (to = now, from = now - 30d).
 * Buckets with zero bookings are simply absent from the result set.
 */
export async function getBookingStats(params: {
  from?: string;
  to?: string;
  group_by: GroupBy;
  status?: BookingStatus;
}): Promise<BookingStatsDTO> {
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from
    ? new Date(params.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const where: WhereOptions = {
    created_at: { [Op.between]: [from, to] },
  };
  if (params.status) {
    (where as Record<string, unknown>).status = params.status;
  }

  const bucketExpr = fn('DATE_FORMAT', col('created_at'), BUCKET_FORMAT[params.group_by]);

  const rows = (await Booking.findAll({
    attributes: [
      [bucketExpr, 'bucket'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where,
    group: [col('bucket')],
    order: [literal('bucket ASC')],
    raw: true,
  })) as unknown as Array<{ bucket: string; count: number }>;

  return {
    group_by: params.group_by,
    from: from.toISOString(),
    to: to.toISOString(),
    buckets: rows.map((r) => ({ bucket: String(r.bucket), count: Number(r.count) })),
  };
}
