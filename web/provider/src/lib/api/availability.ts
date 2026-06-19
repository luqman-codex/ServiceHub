// src/lib/api/availability.ts — Provider availability endpoint functions (02 §8.7).
// PROVIDER portal: every call is server-scoped to the authenticated provider
// (RBAC "O", rows 39-42). We therefore never send `provider_id` — the server uses
// `provider_id = req.user.id`. Calls the shared api client and unwraps the 02 envelope.
import { api, getData, getPage } from './client';
import type { DayOfWeek, Page, ProviderAvailabilityDTO } from '@/types/api';

// --- Query params for GET /provider-availability (02 §8.7) ---
export type AvailabilitySortBy = 'day_of_week' | 'start_time' | 'created_at';
export type AvailabilitySortOrder = 'asc' | 'desc';

export interface AvailabilityListParams {
  day_of_week?: DayOfWeek;
  is_available?: boolean;
  sort_by?: AvailabilitySortBy;
  sort_order?: AvailabilitySortOrder;
  page?: number;
  page_size?: number;
}

// Body for POST /provider-availability (02 §8.7). `provider_id` is ADMIN-only and is
// intentionally omitted here — the provider portal always acts on its own windows.
export interface CreateAvailabilityRequest {
  day_of_week: DayOfWeek;
  start_time: string; // 'HH:mm' or 'HH:mm:ss'
  end_time: string; // 'HH:mm' or 'HH:mm:ss'
  is_available?: boolean; // default true
}

// Body for PATCH /provider-availability/:id (any subset).
export interface UpdateAvailabilityRequest {
  day_of_week?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
}

// Strip undefined/empty values so we never send blank query params to the API.
function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

// Row 39 — GET /provider-availability (own windows; server-scoped).
export function listAvailability(
  params: AvailabilityListParams = {},
): Promise<Page<ProviderAvailabilityDTO>> {
  return getPage<ProviderAvailabilityDTO>(
    api.get('/provider-availability', { params: cleanParams({ ...params }) }),
  );
}

// Row 40 — POST /provider-availability (create own window).
export function createAvailability(
  body: CreateAvailabilityRequest,
): Promise<ProviderAvailabilityDTO> {
  return getData<ProviderAvailabilityDTO>(api.post('/provider-availability', body));
}

// Row 41 — PATCH /provider-availability/:id (update own window).
export function updateAvailability(
  id: number,
  body: UpdateAvailabilityRequest,
): Promise<ProviderAvailabilityDTO> {
  return getData<ProviderAvailabilityDTO>(api.patch(`/provider-availability/${id}`, body));
}

// Row 42 — DELETE /provider-availability/:id (hard-delete; 204 No Content).
export async function deleteAvailability(id: number): Promise<void> {
  await api.delete(`/provider-availability/${id}`);
}
