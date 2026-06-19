'use client';

// src/lib/hooks/useServices.ts — React Query hooks for the services catalog (04 §4,
// §B.2.1, §B.2.5, §B.2.6). Shared by Home (featured) + Browse + Service detail. Queries
// wrap useQuery with the qk key factory (§4.2). Read-only on the customer site (no
// service mutations here — booking creation lives in the bookings feature).
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import {
  getService,
  listServices,
  type ServiceListParams,
} from '@/lib/api/services';
import type { Page, ServiceDTO } from '@/types/api';

/** Paginated/filtered services list (eager-loads category by default). */
export function useServices(
  params: ServiceListParams = {},
): UseQueryResult<Page<ServiceDTO>, ApiError> {
  const filters: ServiceListParams = { include: 'category', ...params };
  return useQuery<Page<ServiceDTO>, ApiError>({
    queryKey: qk.services.list(filters as Record<string, unknown>),
    queryFn: () => listServices(filters),
    placeholderData: (prev) => prev,
  });
}

/** Single service detail (eager-loads its category). */
export function useService(id: number): UseQueryResult<ServiceDTO, ApiError> {
  return useQuery<ServiceDTO, ApiError>({
    queryKey: qk.services.detail(id),
    queryFn: () => getService(id, 'category'),
    enabled: Number.isFinite(id) && id > 0,
  });
}
