'use client';

// src/lib/hooks/useServices.ts — React Query hooks for the services feature (04 §A.2.7).
// Queries wrap useQuery with the qk key factory; mutations wrap useMutation and
// invalidate per the §4.3 matrix:
//   POST/PATCH /services · /price · DELETE → ['services'], ['services', id], ['admin','stats'].
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api, getPage } from '@/lib/api/client';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import {
  createService,
  deleteService,
  getService,
  listServices,
  updateService,
  updateServicePrice,
  type CreateServiceRequest,
  type ServiceDeleteResult,
  type ServiceListParams,
  type UpdateServicePriceRequest,
  type UpdateServiceRequest,
} from '@/lib/api/services';
import type { CategoryDTO, Page, ServiceDTO } from '@/types/api';

// --- Queries ---

/** Paginated/filtered services list (admin always requests ?include=category). */
export function useServices(
  params: ServiceListParams,
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

/**
 * Active categories for the create/edit category dropdown.
 * Reads the live GET /categories list directly via the shared client (read-only,
 * no categories-feature file is owned here).
 */
export function useCategoryOptions(): UseQueryResult<Page<CategoryDTO>, ApiError> {
  const filters = { is_active: true, page_size: 100, sort_by: 'name', sort_order: 'asc' };
  return useQuery<Page<CategoryDTO>, ApiError>({
    queryKey: qk.categories.list(filters),
    queryFn: () => getPage<CategoryDTO>(api.get('/categories', { params: filters })),
    staleTime: 60_000,
  });
}

// --- Mutations ---

// Invalidate everything that depends on the services catalog (§4.3 matrix row for
// POST/PATCH /services · /price · DELETE). Stats are invalidated defensively because
// the dashboard surfaces active-service counts (§8).
function invalidateServiceCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: number,
): void {
  queryClient.invalidateQueries({ queryKey: qk.services.all() });
  if (id !== undefined) {
    queryClient.invalidateQueries({ queryKey: qk.services.detail(id) });
  }
  queryClient.invalidateQueries({ queryKey: qk.admin.stats() });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation<ServiceDTO, ApiError, CreateServiceRequest>({
    mutationFn: (body) => createService(body),
    onSuccess: (service) => invalidateServiceCaches(queryClient, service.id),
  });
}

export function useUpdateService(id: number) {
  const queryClient = useQueryClient();
  return useMutation<ServiceDTO, ApiError, UpdateServiceRequest>({
    mutationFn: (body) => updateService(id, body),
    onSuccess: (service) => invalidateServiceCaches(queryClient, service.id),
  });
}

export function useUpdateServicePrice(id: number) {
  const queryClient = useQueryClient();
  return useMutation<ServiceDTO, ApiError, UpdateServicePriceRequest>({
    mutationFn: (body) => updateServicePrice(id, body),
    onSuccess: (service) => invalidateServiceCaches(queryClient, service.id),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation<ServiceDeleteResult, ApiError, number>({
    mutationFn: (id) => deleteService(id),
    onSuccess: (result) => invalidateServiceCaches(queryClient, result.id),
  });
}
