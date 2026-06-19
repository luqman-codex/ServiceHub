// src/lib/api/admin.ts — admin dashboard stats endpoints using the shared api client.
// 02 §8.8: GET /admin/stats (summary counts) + GET /admin/stats/bookings (time buckets).
// Field names are snake_case to match the wire format verbatim; money DECIMAL fields are STRINGS.
import { api, getData } from './client';
import type { RoleName, BookingStatus } from '@/types/api';

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
    completed_total: string; // DECIMAL as STRING
    paid_total: string; // DECIMAL as STRING
  };
}

export type StatsGroupBy = 'day' | 'week' | 'month';

export interface AdminStatsBookingsQuery {
  from?: string; // ISO date
  to?: string; // ISO date
  group_by?: StatsGroupBy;
  status?: BookingStatus;
}

export interface BookingVolumeBucket {
  bucket: string; // e.g. "2026-06-10"
  count: number;
}

export interface AdminStatsBookingsDTO {
  group_by: StatsGroupBy;
  from: string; // ISO-8601 UTC
  to: string; // ISO-8601 UTC
  buckets: BookingVolumeBucket[];
}

export function getAdminStats(): Promise<AdminStatsDTO> {
  return getData<AdminStatsDTO>(api.get('/admin/stats'));
}

export function getAdminStatsBookings(
  query: AdminStatsBookingsQuery = {},
): Promise<AdminStatsBookingsDTO> {
  return getData<AdminStatsBookingsDTO>(api.get('/admin/stats/bookings', { params: query }));
}
