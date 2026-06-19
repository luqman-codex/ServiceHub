// src/lib/api/categories.ts — categories endpoint functions using the shared api
// client (02 §8.4, rows 17-21). DTO field names are snake_case per 02 §6.
import { api, getData, getPage } from './client';
import type { CategoryDTO, Page } from '@/types/api';

// --- List filters (GET /categories — 02 §8.4) ---
export interface CategoryListParams {
  page?: number;
  page_size?: number;
  sort_by?: 'id' | 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
  // Admin may pass false / omit to see inactive too; public callers default to true.
  is_active?: boolean;
  q?: string;
}

// --- Request bodies (POST/PATCH /categories — 02 §8.4) ---
export interface CreateCategoryRequest {
  name: string;
  slug?: string; // auto-derived from name if omitted
  description?: string | null;
  icon_url?: string | null;
  is_active?: boolean; // default true
}

// PATCH accepts any subset of the mutable fields (at least one).
export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

// DELETE is soft (sets is_active=false) and returns a minimal result (02 §8.4).
export interface SoftDeleteResult {
  id: number;
  is_active: boolean;
}

export function listCategories(params: CategoryListParams = {}): Promise<Page<CategoryDTO>> {
  return getPage<CategoryDTO>(api.get('/categories', { params }));
}

export function getCategory(id: number): Promise<CategoryDTO> {
  return getData<CategoryDTO>(api.get(`/categories/${id}`));
}

export function createCategory(body: CreateCategoryRequest): Promise<CategoryDTO> {
  return getData<CategoryDTO>(api.post('/categories', body));
}

export function updateCategory(id: number, body: UpdateCategoryRequest): Promise<CategoryDTO> {
  return getData<CategoryDTO>(api.patch(`/categories/${id}`, body));
}

export function deleteCategory(id: number): Promise<SoftDeleteResult> {
  return getData<SoftDeleteResult>(api.delete(`/categories/${id}`));
}
