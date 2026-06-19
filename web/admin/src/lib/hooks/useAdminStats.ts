'use client';

// src/lib/hooks/useAdminStats.ts (04 §4, §8) — dashboard data hooks.
// Each widget owns an independent query so a single failure degrades to a card-level
// error + retry rather than blanking the whole dashboard.
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import {
  getAdminStats,
  getAdminStatsBookings,
  type AdminStatsDTO,
  type AdminStatsBookingsDTO,
  type AdminStatsBookingsQuery,
} from '@/lib/api/admin';

/** Summary counts for the dashboard (users / bookings / catalog / revenue). */
export function useAdminStats() {
  return useQuery<AdminStatsDTO>({
    queryKey: qk.admin.stats(),
    queryFn: () => getAdminStats(),
  });
}

/** Time-bucketed booking volume; refetches when range / group_by change. */
export function useAdminStatsBookings(query: AdminStatsBookingsQuery = {}) {
  return useQuery<AdminStatsBookingsDTO>({
    queryKey: qk.admin.statsBookings(query as Record<string, unknown>),
    queryFn: () => getAdminStatsBookings(query),
  });
}
