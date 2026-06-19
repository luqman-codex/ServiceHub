'use client';

// src/app/services/page.tsx — PUBLIC Browse / Filter Services (C-4, 04 §B.2.5).
// GET /services with category_id, q, price_min, price_max, sort_by (name|price|created_at),
// sort_order, include=category + pagination. Filters live in the URL so they are shareable
// and survive refresh; the price-range filter is an RHF + zod form that maps 422
// ApiError.details onto its fields. Renders loading / empty / error / success states.
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, SlidersHorizontal, PackageSearch } from 'lucide-react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api, getPage } from '@/lib/api/client';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import type { CategoryDTO, Page, ServiceDTO } from '@/types/api';
import { ServiceCard } from '@/components/domain';
import { LoadingState, EmptyState, ErrorState } from '@/components/data';
import { Pagination, Input, Select, Button } from '@/components/ui';

const PAGE_SIZE = 12;

type SortBy = 'created_at' | 'name' | 'price';
type SortOrder = 'asc' | 'desc';

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Newest', value: 'created_at:desc' },
  { label: 'Name (A–Z)', value: 'name:asc' },
  { label: 'Name (Z–A)', value: 'name:desc' },
  { label: 'Price (low → high)', value: 'price:asc' },
  { label: 'Price (high → low)', value: 'price:desc' },
];

// --- Derived filter state read from the URL search params (the source of truth) ---
interface ServiceFilters {
  page: number;
  q: string;
  category_id: number | null;
  price_min: string;
  price_max: string;
  sort_by: SortBy;
  sort_order: SortOrder;
}

function parseFilters(params: URLSearchParams): ServiceFilters {
  const rawSortBy = params.get('sort_by');
  const sort_by: SortBy =
    rawSortBy === 'name' || rawSortBy === 'price' ? rawSortBy : 'created_at';
  const sort_order: SortOrder = params.get('sort_order') === 'asc' ? 'asc' : 'desc';
  const pageNum = Number(params.get('page'));
  const catNum = Number(params.get('category_id'));
  return {
    page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
    q: params.get('q') ?? '',
    category_id: Number.isFinite(catNum) && catNum > 0 ? catNum : null,
    price_min: params.get('price_min') ?? '',
    price_max: params.get('price_max') ?? '',
    sort_by,
    sort_order,
  };
}

// Strips empty/default values so we never push blank query params into the URL.
function buildQuery(filters: ServiceFilters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.q) sp.set('q', filters.q);
  if (filters.category_id != null) sp.set('category_id', String(filters.category_id));
  if (filters.price_min) sp.set('price_min', filters.price_min);
  if (filters.price_max) sp.set('price_max', filters.price_max);
  if (filters.sort_by !== 'created_at') sp.set('sort_by', filters.sort_by);
  if (filters.sort_order !== 'desc') sp.set('sort_order', filters.sort_order);
  if (filters.page > 1) sp.set('page', String(filters.page));
  return sp;
}

// --- Data hooks (read-only; built on the shared client + qk factory) ---
function useServiceList(
  filters: ServiceFilters,
): UseQueryResult<Page<ServiceDTO>, ApiError> {
  // is_active is enforced server-side for public callers (true only, 02 §8.5).
  const apiParams: Record<string, unknown> = {
    include: 'category',
    is_active: true,
    page: filters.page,
    page_size: PAGE_SIZE,
    sort_by: filters.sort_by,
    sort_order: filters.sort_order,
  };
  if (filters.q) apiParams.q = filters.q;
  if (filters.category_id != null) apiParams.category_id = filters.category_id;
  if (filters.price_min) apiParams.price_min = filters.price_min;
  if (filters.price_max) apiParams.price_max = filters.price_max;

  return useQuery<Page<ServiceDTO>, ApiError>({
    queryKey: qk.services.list(apiParams),
    queryFn: () => getPage<ServiceDTO>(api.get('/services', { params: apiParams })),
    placeholderData: (prev) => prev,
  });
}

function useCategoryOptions(): UseQueryResult<Page<CategoryDTO>, ApiError> {
  const filters = {
    is_active: true,
    page_size: 100,
    sort_by: 'name',
    sort_order: 'asc',
  } as const;
  return useQuery<Page<CategoryDTO>, ApiError>({
    queryKey: qk.categories.list(filters as Record<string, unknown>),
    queryFn: () => getPage<CategoryDTO>(api.get('/categories', { params: filters })),
    staleTime: 60_000,
  });
}

// --- Price-range filter form (RHF + zod) ---
const priceSchema = z
  .object({
    price_min: z
      .string()
      .trim()
      .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
        message: 'Enter a valid non-negative amount',
      }),
    price_max: z
      .string()
      .trim()
      .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
        message: 'Enter a valid non-negative amount',
      }),
  })
  .refine(
    (v) =>
      v.price_min === '' ||
      v.price_max === '' ||
      Number(v.price_min) <= Number(v.price_max),
    { message: 'Minimum must be ≤ maximum', path: ['price_max'] },
  );

type PriceForm = z.infer<typeof priceSchema>;

// useSearchParams() requires a Suspense boundary during App Router prerendering.
export default function ServicesPage() {
  return (
    <Suspense
      fallback={<LoadingState variant="cards" rows={8} label="Loading services…" />}
    >
      <ServicesBrowser />
    </Suspense>
  );
}

function ServicesBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Push a new filter set into the URL (resetting to page 1 unless explicitly paginating).
  function applyFilters(next: Partial<ServiceFilters>): void {
    const merged: ServiceFilters = { ...filters, page: 1, ...next };
    const qs = buildQuery(merged).toString();
    router.push(qs ? `/services?${qs}` : '/services');
  }

  // --- Search box (debounced into the URL) ---
  const [search, setSearch] = useState(filters.q);
  useEffect(() => {
    setSearch(filters.q);
  }, [filters.q]);
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => applyFilters({ q: search }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // --- Price form (resets when the URL price bounds change) ---
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PriceForm>({
    resolver: zodResolver(priceSchema),
    values: { price_min: filters.price_min, price_max: filters.price_max },
  });

  const list = useServiceList(filters);
  const categories = useCategoryOptions();

  const categoryOptions = [
    { label: 'All categories', value: '' },
    ...(categories.data?.items ?? []).map((c) => ({ label: c.name, value: String(c.id) })),
  ];

  const services = list.data?.items ?? [];
  const hasActiveFilters =
    !!filters.q || filters.category_id != null || !!filters.price_min || !!filters.price_max;

  function onPriceSubmit(values: PriceForm): void {
    applyFilters({ price_min: values.price_min.trim(), price_max: values.price_max.trim() });
  }

  // Surface a server-side 422 on the price bounds back onto the form fields (§9 forms).
  useEffect(() => {
    if (!list.isError) return;
    const err = list.error;
    if (err instanceof ApiError && err.details) {
      for (const fe of err.details) {
        if (fe.field === 'price_min' || fe.field === 'price_max') {
          setError(fe.field, { type: 'server', message: fe.message });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.isError, list.error]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Browse Services</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search and filter the full catalog of services.
        </p>
      </header>

      {/* Filter / sort / search controls */}
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="services-q" className="block text-sm font-medium text-slate-700">
              Search
            </label>
            <Input
              id="services-q"
              type="search"
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="services-category"
              className="block text-sm font-medium text-slate-700"
            >
              Category
            </label>
            <Select
              id="services-category"
              options={categoryOptions}
              value={filters.category_id != null ? String(filters.category_id) : ''}
              disabled={categories.isLoading}
              onChange={(e) =>
                applyFilters({
                  category_id: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="services-sort" className="block text-sm font-medium text-slate-700">
              Sort by
            </label>
            <Select
              id="services-sort"
              options={SORT_OPTIONS}
              value={`${filters.sort_by}:${filters.sort_order}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':') as [SortBy, SortOrder];
                applyFilters({ sort_by: sb, sort_order: so });
              }}
            />
          </div>
        </div>

        {/* Price range */}
        <form className="flex items-start gap-3" onSubmit={handleSubmit(onPriceSubmit)}>
          <div className="space-y-1.5">
            <label htmlFor="price-min" className="block text-sm font-medium text-slate-700">
              Min price
            </label>
            <Input
              id="price-min"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0"
              className="w-28"
              invalid={!!errors.price_min}
              {...register('price_min')}
            />
            {errors.price_min?.message && (
              <p className="text-xs text-red-600">{errors.price_min.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="price-max" className="block text-sm font-medium text-slate-700">
              Max price
            </label>
            <Input
              id="price-max"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Any"
              className="w-28"
              invalid={!!errors.price_max}
              {...register('price_max')}
            />
            {errors.price_max?.message && (
              <p className="text-xs text-red-600">{errors.price_max.message}</p>
            )}
          </div>
          <Button
            type="submit"
            variant="outline"
            className="mt-7"
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          >
            Apply
          </Button>
        </form>
      </div>

      {/* Results */}
      {list.isLoading ? (
        <LoadingState variant="cards" rows={8} label="Loading services…" />
      ) : list.isError ? (
        <ErrorState
          title="Unable to load services"
          error={list.error}
          onRetry={() => void list.refetch()}
        />
      ) : services.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No services match"
          description={
            hasActiveFilters
              ? 'No services match your filters. Try clearing them to see more.'
              : 'There are no services available right now.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={() => router.push('/services')}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          <Pagination
            meta={list.data?.meta}
            onPageChange={(page) => applyFilters({ page })}
          />
        </>
      )}
    </section>
  );
}
