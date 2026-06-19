// src/lib/api/availability.ts — Provider availability endpoint functions (02 §8.7).
// Calls the shared api client and unwraps the 02 envelope via getData/getPage.
import { api, getData, getPage } from './client';
import type { DayOfWeek, Page, ProviderAvailabilityDTO } from '@/types/api';

export interface AvailabilityListParams {
  provider_id: number; // ADMIN reads another provider's windows
  day_of_week?: DayOfWeek;
  is_available?: boolean;
  sort_by?: 'day_of_week' | 'start_time' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface CreateAvailabilityRequest {
  day_of_week: DayOfWeek;
  start_time: string; // 'HH:mm' or 'HH:mm:ss'
  end_time: string;
  is_available?: boolean;
  provider_id?: number; // ADMIN only; must be a PROVIDER
}

export interface UpdateAvailabilityRequest {
  day_of_week?: DayOfWeek;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
}

export function listAvailability(
  params: AvailabilityListParams,
): Promise<Page<ProviderAvailabilityDTO>> {
  return getPage<ProviderAvailabilityDTO>(api.get('/provider-availability', { params }));
}

export function createAvailability(
  body: CreateAvailabilityRequest,
): Promise<ProviderAvailabilityDTO> {
  return getData<ProviderAvailabilityDTO>(api.post('/provider-availability', body));
}

export function updateAvailability(
  id: number,
  body: UpdateAvailabilityRequest,
): Promise<ProviderAvailabilityDTO> {
  return getData<ProviderAvailabilityDTO>(api.patch(`/provider-availability/${id}`, body));
}

export async function deleteAvailability(id: number): Promise<void> {
  await api.delete(`/provider-availability/${id}`); // 204 No Content
}
