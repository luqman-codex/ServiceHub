'use client';

// src/app/(dashboard)/categories/page.tsx — A-4 Categories list (04 §A.2.6).
// GET /categories with admin filters (is_active, q, sort, page). DataTable wires the
// four UI states; row click → edit. "New category" CTA. Admin-only route guard.
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import {
  Button,
  Input,
  Select,
  DataTable,
  Pagination,
  type DataTableColumn,
  type SortOrder,
} from '@/components/ui';
import { ActiveBadge, DateTimeText } from '@/components/domain';
import { useCategories } from '@/lib/hooks/useCategories';
import type { CategoryDTO } from '@/types/api';
import type { CategoryListParams } from '@/lib/api/categories';

const PAGE_SIZE = 20;

type ActiveFilter = 'all' | 'active' | 'inactive';

function CategoriesScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const params = useMemo<CategoryListParams>(() => {
    const p: CategoryListParams = {
      page,
      page_size: PAGE_SIZE,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    if (search.trim()) p.q = search.trim();
    if (activeFilter === 'active') p.is_active = true;
    if (activeFilter === 'inactive') p.is_active = false;
    return p;
  }, [page, search, activeFilter, sortBy, sortOrder]);

  const { data, isLoading, isError, error, refetch } = useCategories(params);

  const columns = useMemo<DataTableColumn<CategoryDTO>[]>(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortKey: 'name',
        cell: (c) => <span className="font-medium text-slate-900">{c.name}</span>,
      },
      {
        key: 'slug',
        header: 'Slug',
        cell: (c) => <span className="font-mono text-xs text-slate-500">{c.slug}</span>,
      },
      {
        key: 'description',
        header: 'Description',
        cell: (c) =>
          c.description ? (
            <span className="line-clamp-1 text-slate-600">{c.description}</span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: 'is_active',
        header: 'Status',
        cell: (c) => <ActiveBadge active={c.is_active} />,
      },
      {
        key: 'created_at',
        header: 'Created',
        sortKey: 'created_at',
        cell: (c) => <DateTimeText value={c.created_at} format="date" />,
      },
    ],
    [],
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(q);
  };

  const handleSortChange = (nextSortBy: string, nextSortOrder: SortOrder) => {
    setSortBy(nextSortBy as 'id' | 'name' | 'created_at');
    setSortOrder(nextSortOrder);
    setPage(1);
  };

  return (
    <AppShell title="Categories">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Categories</h1>
            <p className="text-sm text-slate-500">Manage the service catalog taxonomy.</p>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => router.push('/categories/new')}>
            New category
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={submitSearch} className="flex-1">
            <Input
              type="search"
              placeholder="Search by name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              aria-label="Search categories"
            />
          </form>
          <Select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as ActiveFilter);
              setPage(1);
            }}
            aria-label="Filter by status"
            className="sm:w-44"
            options={[
              { label: 'All statuses', value: 'all' },
              { label: 'Active only', value: 'active' },
              { label: 'Inactive only', value: 'inactive' },
            ]}
          />
        </div>

        <DataTable<CategoryDTO>
          columns={columns}
          rows={data?.items}
          rowKey={(c) => c.id}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          onRowClick={(c) => router.push(`/categories/${c.id}`)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          emptyTitle="No categories yet — create your first."
          emptyDescription="Categories group the services your providers offer."
          emptyAction={
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => router.push('/categories/new')}
            >
              New category
            </Button>
          }
        />

        {data && data.items.length > 0 && (
          <Pagination meta={data.meta} onPageChange={(p) => setPage(p)} />
        )}
      </div>
    </AppShell>
  );
}

export default function CategoriesPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <CategoriesScreen />
    </ProtectedRoute>
  );
}
