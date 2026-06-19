'use client';

// src/lib/hooks/useProviderAvailability.ts (04 §4) — React Query hooks for a
// provider's availability windows. Mutations invalidate ['providerAvailability', providerId]
// per the §4.3 matrix.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import {
  createAvailability,
  deleteAvailability,
  listAvailability,
  updateAvailability,
  type CreateAvailabilityRequest,
  type UpdateAvailabilityRequest,
} from '@/lib/api/availability';
import type { Page, ProviderAvailabilityDTO } from '@/types/api';

export function useProviderAvailability(providerId: number, enabled = true) {
  return useQuery<Page<ProviderAvailabilityDTO>, ApiError>({
    queryKey: qk.availability.byProvider(providerId),
    queryFn: () =>
      listAvailability({ provider_id: providerId, sort_by: 'day_of_week', sort_order: 'asc' }),
    enabled: enabled && Number.isFinite(providerId) && providerId > 0,
  });
}

export function useCreateAvailability(providerId: number) {
  const qc = useQueryClient();
  return useMutation<ProviderAvailabilityDTO, ApiError, CreateAvailabilityRequest>({
    mutationFn: (body) => createAvailability({ ...body, provider_id: providerId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.availability.byProvider(providerId) });
    },
  });
}

export function useUpdateAvailability(providerId: number) {
  const qc = useQueryClient();
  return useMutation<
    ProviderAvailabilityDTO,
    ApiError,
    { id: number; body: UpdateAvailabilityRequest }
  >({
    mutationFn: ({ id, body }) => updateAvailability(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.availability.byProvider(providerId) });
    },
  });
}

export function useDeleteAvailability(providerId: number) {
  const qc = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => deleteAvailability(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.availability.byProvider(providerId) });
    },
  });
}
