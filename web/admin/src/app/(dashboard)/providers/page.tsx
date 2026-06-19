'use client';

// src/app/(dashboard)/providers/page.tsx (04 §A.2.10) — Providers list (A-10).
// PROVIDER users only (GET /users?role=PROVIDER) with search + is_active filter,
// sortable columns, pagination, and the four UI states via DataTable.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn, type SortOrder } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ActiveBadge } from '@/components/domain/ActiveBadge';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { useUsers } from '@/lib/hooks/useUsers';
import type { UserDTO } from '@/types/api';

const PAGE_SIZE = 20;

type StatusFilter = '' | 'true' | 'false';

function ProvidersListInner() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'email' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      role: 'PROVIDER' as const,
      page,
      page_size: PAGE_SIZE,
      q: debouncedQ || undefined,
      is_active: status === '' ? undefined : status === 'true',
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [page, debouncedQ, status, sortBy, sortOrder],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useUsers(params);

  const hasFilters = Boolean(debouncedQ) || status !== '';

  const clearFilters = () => {
    setSearch('');
    setDebouncedQ('');
    setStatus('');
    setPage(1);
  };

  const columns: DataTableColumn<UserDTO>[] = [
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      cell: (u) => <span className="font-medium text-slate-900">{u.name}</span>,
    },
    { key: 'email', header: 'Email', sortKey: 'email', cell: (u) => u.email },
    { key: 'phone', header: 'Phone', cell: (u) => u.phone ?? '—' },
    { key: 'active', header: 'Status', cell: (u) => <ActiveBadge active={u.is_active} /> },
    {
      key: 'created_at',
      header: 'Joined',
      sortKey: 'created_at',
      cell: (u) => <DateTimeText value={u.created_at} format="date" />,
    },
  ];

  const handleSort = (nextSortBy: string, nextOrder: SortOrder) => {
    setSortBy(nextSortBy as typeof sortBy);
    setSortOrder(nextOrder);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Providers</h1>
        <p className="text-sm text-slate-500">Manage provider profiles and availability.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              type="search"
              placeholder="Search name or email…"
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search providers"
            />
          </div>
          <Select
            className="w-40"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      <DataTable<UserDTO>
        columns={columns}
        rows={data?.items}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(u) => router.push(`/providers/${u.id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSort}
        emptyTitle="No providers match your filters."
        emptyDescription={hasFilters ? 'Try clearing filters to see all providers.' : 'Create a user with the Provider role to get started.'}
        emptyAction={
          hasFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
      />

      <Pagination meta={data?.meta} onPageChange={(p) => setPage(p)} />

      {isFetching && !isLoading && (
        <p className="text-center text-xs text-slate-400">Updating…</p>
      )}
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell title="Providers">
        <ProvidersListInner />
      </AppShell>
    </ProtectedRoute>
  );
}
