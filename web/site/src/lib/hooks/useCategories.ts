'use client';

// src/lib/hooks/useCategories.ts — React Query hooks for categories (04 §4, §B.2.1, §B.2.4).
// Read-only on the site (public catalog browsing): queries key off the qk factory (§4.2).
// There are no category mutations in the customer site.
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import {
  listCategories,
  getCategory,
  type CategoryListParams,
} from '@/lib/api/categories';
import type { CategoryDTO, Page } from '@/types/api';

/** Paginated/filtered active categories list (Home + Browse categories). */
export function useCategories(
  params: CategoryListParams = {},
): UseQueryResult<Page<CategoryDTO>, ApiError> {
  return useQuery<Page<CategoryDTO>, ApiError>({
    queryKey: qk.categories.list(params as Record<string, unknown>),
    queryFn: () => listCategories(params),
    placeholderData: (prev) => prev,
  });
}

/** Single category detail. */
export function useCategory(id: number): UseQueryResult<CategoryDTO, ApiError> {
  return useQuery<CategoryDTO, ApiError>({
    queryKey: qk.categories.detail(id),
    queryFn: () => getCategory(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
