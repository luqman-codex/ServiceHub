'use client';

// src/app/categories/page.tsx — PUBLIC Browse Categories (C-3, 04 §B.2.4).
// Lists ACTIVE categories: GET /categories?is_active=true (paginated). Tapping a tile
// navigates to the filtered services list (/services?category_id=:id) via <CategoryTile>.
// Renders all four data states (loading / empty / error / success) per §7.4.
import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { api, getPage } from '@/lib/api/client';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CategoryDTO, Page } from '@/types/api';
import { CategoryTile } from '@/components/domain';
import { LoadingState, EmptyState, ErrorState } from '@/components/data';
import { Pagination } from '@/components/ui';

const PAGE_SIZE = 24;

// Active categories only (public callers), sorted by name (02 §8.4 default).
function useActiveCategories(
  page: number,
): UseQueryResult<Page<CategoryDTO>, ApiError> {
  const filters = {
    is_active: true,
    page,
    page_size: PAGE_SIZE,
    sort_by: 'name',
    sort_order: 'asc',
  } as const;
  return useQuery<Page<CategoryDTO>, ApiError>({
    queryKey: qk.categories.list(filters as Record<string, unknown>),
    queryFn: () => getPage<CategoryDTO>(api.get('/categories', { params: filters })),
    placeholderData: (prev) => prev,
  });
}

export default function CategoriesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useActiveCategories(page);

  const categories = data?.items ?? [];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Browse Categories</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a category to explore available services.
        </p>
      </header>

      {isLoading ? (
        <LoadingState variant="cards" rows={8} label="Loading categories…" />
      ) : isError ? (
        <ErrorState
          title="Unable to load categories"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No categories"
          description="There are no categories available right now. Please check back later."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
          <Pagination meta={data?.meta} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
