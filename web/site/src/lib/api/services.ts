// src/lib/api/services.ts — services endpoint functions using the shared api client
// (02 §8.5). Money DECIMAL fields are STRINGS; field names are snake_case to match the
// wire format verbatim. Lists go through getPage(), single resources through getData().
// On the site these power the public catalog (Home, Browse, Service detail).
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

// Strips undefined/null/'' so we never send empty query params.
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

// GET /services — list/browse the catalog (public).
export function listServices(params: ServiceListParams = {}): Promise<Page<ServiceDTO>> {
  return getPage<ServiceDTO>(api.get('/services', { params: cleanParams(params) }));
}

// GET /services/:id — single service (supports ?include=category).
export function getService(id: number, include = 'category'): Promise<ServiceDTO> {
  return getData<ServiceDTO>(api.get(`/services/${id}`, { params: { include } }));
}
