// src/lib/api/categories.ts — categories endpoint functions using the shared api
// client (02 §8.4). DTO field names are snake_case per 02 §6. On the site, callers
// browse the public catalog and default to active categories only.
import { api, getData, getPage } from './client';
import type { CategoryDTO, Page } from '@/types/api';

// --- List filters (GET /categories — 02 §8.4) ---
export interface CategoryListParams {
  page?: number;
  page_size?: number;
  sort_by?: 'id' | 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
  // Public callers pass true to see only active categories (§B.2.1, §B.2.4).
  is_active?: boolean;
  q?: string;
}

// Strips undefined/null/'' so we never send empty query params.
function cleanParams(params: CategoryListParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  (Object.keys(params) as (keyof CategoryListParams)[]).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      out[key] = value;
    }
  });
  return out;
}

// GET /categories — list/browse (public; site passes is_active=true).
export function listCategories(params: CategoryListParams = {}): Promise<Page<CategoryDTO>> {
  return getPage<CategoryDTO>(api.get('/categories', { params: cleanParams(params) }));
}

// GET /categories/:id — single category.
export function getCategory(id: number): Promise<CategoryDTO> {
  return getData<CategoryDTO>(api.get(`/categories/${id}`));
}
