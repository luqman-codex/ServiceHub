'use client';

// src/lib/hooks/useAvailability.ts (04 §4) — React Query hooks for the PROVIDER's own
// availability windows. Queries use the qk key factory; every mutation invalidates the
// base ['providerAvailability'] key so all list variants refetch.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAvailability,
  deleteAvailability,
  listAvailability,
  updateAvailability,
  type AvailabilityListParams,
  type CreateAvailabilityRequest,
  type UpdateAvailabilityRequest,
} from '@/lib/api/availability';
import { ApiError } from '@/lib/api/errors';
import { qk } from '@/lib/react-query/keys';
import type { Page, ProviderAvailabilityDTO } from '@/types/api';

// GET /provider-availability — the provider's own windows (server-scoped),
// sorted by day then start time so the UI can group them deterministically.
export function useAvailability(params: AvailabilityListParams = {}) {
  const merged: AvailabilityListParams = {
    sort_by: 'day_of_week',
    sort_order: 'asc',
    page_size: 100,
    ...params,
  };
  return useQuery<Page<ProviderAvailabilityDTO>, ApiError>({
    queryKey: qk.availability.list(merged as Record<string, unknown>),
    queryFn: () => listAvailability(merged),
    placeholderData: (prev) => prev,
  });
}

// POST /provider-availability — add a window; invalidate all availability lists.
export function useCreateAvailability() {
  const qc = useQueryClient();
  return useMutation<ProviderAvailabilityDTO, ApiError, CreateAvailabilityRequest>({
    mutationFn: (body) => createAvailability(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.availability.all() });
    },
  });
}

// PATCH /provider-availability/:id — edit a window (incl. the is_available toggle).
export function useUpdateAvailability() {
  const qc = useQueryClient();
  return useMutation<
    ProviderAvailabilityDTO,
    ApiError,
    { id: number; body: UpdateAvailabilityRequest }
  >({
    mutationFn: ({ id, body }) => updateAvailability(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.availability.all() });
    },
  });
}

// DELETE /provider-availability/:id — remove a window.
export function useDeleteAvailability() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => deleteAvailability(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.availability.all() });
    },
  });
}
