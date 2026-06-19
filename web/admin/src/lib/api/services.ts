// src/lib/api/services.ts — services endpoint functions using the shared api client.
// Endpoints rows 22-27 (02 §8.5). Money DECIMAL fields are STRINGS; field names are
// snake_case to match the wire format verbatim. Lists go through getPage(), single
// resources through getData().
import { api, getData, getPage } from './client';
import type { Page, ServiceDTO } from '@/types/api';

// --- Query params for GET /services (02 §8.5) ---
export type ServiceSortBy = 'id' | 'name' | 'price' | 'created_at';
export type ServiceSortOrder = 'asc' | 'desc';

export interface ServiceListParams {
  page?: number;
  page_size?: number;
  sort_by?: ServiceSortBy;
  sort_order?: ServiceSortOrder;
  category_id?: number;
  is_active?: boolean;
  q?: string;
  price_min?: string;
  price_max?: string;
  /** comma list; supports "category". */
  include?: string;
}

// --- Request bodies (02 §8.5) ---
export interface CreateServiceRequest {
  category_id: number;
  name: string;
  description?: string | null;
  price: string; // DECIMAL(10,2) sent as a STRING
  currency?: string; // ISO 4217, default "USD"
  duration_minutes?: number | null;
  image_url?: string | null;
  is_active?: boolean; // default true
}

// PATCH /services/:id accepts any subset of the create fields.
export type UpdateServiceRequest = Partial<CreateServiceRequest>;

// PATCH /services/:id/price — dedicated price editor (A-6).
export interface UpdateServicePriceRequest {
  price: string; // DECIMAL(10,2) sent as a STRING
  currency?: string;
}

// Soft-delete result envelope (02 §8.5 DELETE).
export interface ServiceDeleteResult {
  id: number;
  is_active: boolean;
}

// Strips undefined keys so we never send empty query params.
function cleanParams(params: ServiceListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  (Object.keys(params) as (keyof ServiceListParams)[]).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      out[key] = value;
    }
  });
  return out;
}

// GET /services — list/browse (admin may filter is_active and override defaults).
export function listServices(params: ServiceListParams = {}): Promise<Page<ServiceDTO>> {
  return getPage<ServiceDTO>(api.get('/services', { params: cleanParams(params) }));
}

// GET /services/:id — single service (supports ?include=category).
export function getService(id: number, include = 'category'): Promise<ServiceDTO> {
  return getData<ServiceDTO>(api.get(`/services/${id}`, { params: { include } }));
}

// POST /services — create (ADMIN).
export function createService(body: CreateServiceRequest): Promise<ServiceDTO> {
  return getData<ServiceDTO>(api.post('/services', body));
}

// PATCH /services/:id — update (ADMIN).
export function updateService(id: number, body: UpdateServiceRequest): Promise<ServiceDTO> {
  return getData<ServiceDTO>(api.patch(`/services/${id}`, body));
}

// PATCH /services/:id/price — dedicated price update (ADMIN, A-6).
export function updateServicePrice(
  id: number,
  body: UpdateServicePriceRequest,
): Promise<ServiceDTO> {
  return getData<ServiceDTO>(api.patch(`/services/${id}/price`, body));
}

// DELETE /services/:id — soft-delete / deactivate (ADMIN).
export function deleteService(id: number): Promise<ServiceDeleteResult> {
  return getData<ServiceDeleteResult>(api.delete(`/services/${id}`));
}
