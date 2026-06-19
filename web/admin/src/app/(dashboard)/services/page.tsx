'use client';

// /services — Services list (A-5, 04 §A.2.7).
// Filter by category / is_active / price + search + sort, paginate, and link into the
// create/edit screens. The DataTable renders loading/empty/error/success states (§7.4).
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, type DataTableColumn, type SortOrder } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ActiveBadge } from '@/components/domain/ActiveBadge';
import { MoneyText } from '@/components/domain/MoneyText';
import { useCategoryOptions, useServices } from '@/lib/hooks/useServices';
import type { ServiceSortBy } from '@/lib/api/services';
import type { ServiceDTO } from '@/types/api';

const PAGE_SIZE = 20;

type ActiveFilter = 'all' | 'true' | 'false';

function ServicesScreen() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState<ServiceSortBy>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const categoriesQuery = useCategoryOptions();
  const categoryOptions = useMemo(
    () =>
      (categoriesQuery.data?.items ?? []).map((c) => ({
        label: c.name,
        value: String(c.id),
      })),
    [categoriesQuery.data],
  );

  const servicesQuery = useServices({
    page,
    page_size: PAGE_SIZE,
    sort_by: sortBy,
    sort_order: sortOrder,
    q: search.trim() || undefined,
    category_id: categoryId ? Number(categoryId) : undefined,
    is_active: activeFilter === 'all' ? undefined : activeFilter === 'true',
    price_min: priceMin.trim() || undefined,
    price_max: priceMax.trim() || undefined,
  });

  const rows = servicesQuery.data?.items;
  const meta = servicesQuery.data?.meta;

  // Any non-default filter is active → tweaks the empty-state copy/CTA (§7.4).
  const hasFilters =
    search.trim() !== '' ||
    categoryId !== '' ||
    activeFilter !== 'all' ||
    priceMin.trim() !== '' ||
    priceMax.trim() !== '';

  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setActiveFilter('all');
    setPriceMin('');
    setPriceMax('');
    setPage(1);
  };

  const onSortChange = (nextSortBy: string, nextSortOrder: SortOrder) => {
    setSortBy(nextSortBy as ServiceSortBy);
    setSortOrder(nextSortOrder);
    setPage(1);
  };

  const columns: DataTableColumn<ServiceDTO>[] = [
    {
      key: 'name',
      header: 'Service',
      sortKey: 'name',
      cell: (s) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{s.name}</span>
          {s.description && (
            <span className="line-clamp-1 max-w-md text-xs text-slate-500">{s.description}</span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (s) => <span className="text-slate-600">{s.category?.name ?? `#${s.category_id}`}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      sortKey: 'price',
      align: 'right',
      cell: (s) => <MoneyText amount={s.price} currency={s.currency} />,
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'right',
      cell: (s) => (
        <span className="text-slate-600">{s.duration_minutes != null ? `${s.duration_minutes} min` : '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => <ActiveBadge active={s.is_active} />,
    },
  ];

  return (
    <AppShell title="Services">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Services</h1>
            <p className="text-sm text-slate-500">Manage your catalog and pricing.</p>
          </div>
          <Link href="/services/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New service</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <Input
                type="search"
                placeholder="Search by name"
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                aria-label="Search services by name"
              />
            </div>
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as ActiveFilter);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Min price"
              value={priceMin}
              onChange={(e) => {
                setPriceMin(e.target.value);
                setPage(1);
              }}
              aria-label="Minimum price"
            />
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Max price"
              value={priceMax}
              onChange={(e) => {
                setPriceMax(e.target.value);
                setPage(1);
              }}
              aria-label="Maximum price"
            />
            {hasFilters && (
              <div className="sm:col-span-2 lg:col-span-6">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <DataTable<ServiceDTO>
          columns={columns}
          rows={rows}
          rowKey={(s) => s.id}
          isLoading={servicesQuery.isLoading}
          isError={servicesQuery.isError}
          error={servicesQuery.error}
          onRetry={() => servicesQuery.refetch()}
          onRowClick={(s) => router.push(`/services/${s.id}`)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          emptyTitle={hasFilters ? 'No services match your filters' : 'No services'}
          emptyDescription={
            hasFilters ? 'Try adjusting or clearing your filters.' : 'Add one to your catalog.'
          }
          emptyAction={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              <Link href="/services/new">
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                  New service
                </Button>
              </Link>
            )
          }
        />

        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </AppShell>
  );
}

export default function ServicesPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <ServicesScreen />
    </ProtectedRoute>
  );
}
