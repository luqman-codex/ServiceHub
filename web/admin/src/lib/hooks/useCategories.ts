'use client';

// src/lib/hooks/useCategories.ts — React Query hooks for categories (04 §4, §A.2.6).
// Queries key off the qk factory (§4.2); mutations invalidate per the §4.3 matrix:
//   POST/PATCH/DELETE /categories → ['categories'], ['categories', id], ['services'].
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import type { CategoryDTO, Page } from '@/types/api';
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryListParams,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
  type SoftDeleteResult,
} from '@/lib/api/categories';

export function useCategories(params: CategoryListParams = {}) {
  return useQuery<Page<CategoryDTO>>({
    queryKey: qk.categories.list(params as Record<string, unknown>),
    queryFn: () => listCategories(params),
  });
}

export function useCategory(id: number, enabled = true) {
  return useQuery<CategoryDTO>({
    queryKey: qk.categories.detail(id),
    queryFn: () => getCategory(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation<CategoryDTO, unknown, CreateCategoryRequest>({
    mutationFn: (body) => createCategory(body),
    onSuccess: () => {
      // §4.3: a new category can appear in active-service display contexts.
      qc.invalidateQueries({ queryKey: qk.categories.all() });
      qc.invalidateQueries({ queryKey: qk.services.all() });
    },
  });
}

export function useUpdateCategory(id: number) {
  const qc = useQueryClient();
  return useMutation<CategoryDTO, unknown, UpdateCategoryRequest>({
    mutationFn: (body) => updateCategory(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(qk.categories.detail(id), updated);
      qc.invalidateQueries({ queryKey: qk.categories.all() });
      qc.invalidateQueries({ queryKey: qk.categories.detail(id) });
      qc.invalidateQueries({ queryKey: qk.services.all() });
    },
  });
}

export function useDeleteCategory(id: number) {
  const qc = useQueryClient();
  return useMutation<SoftDeleteResult, unknown, void>({
    mutationFn: () => deleteCategory(id),
    onSuccess: () => {
      // Soft-delete also invalidates ['services']: active services depend on
      // active categories for display (§A.2.6 Success, §4.3).
      qc.invalidateQueries({ queryKey: qk.categories.all() });
      qc.invalidateQueries({ queryKey: qk.categories.detail(id) });
      qc.invalidateQueries({ queryKey: qk.services.all() });
    },
  });
}
