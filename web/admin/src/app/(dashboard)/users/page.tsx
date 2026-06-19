'use client';

// src/app/(dashboard)/users/page.tsx (04 §A.2.3) — Users list (A-3).
// Search (debounced → q) + role + is_active filters, sortable columns, pagination.
// Implements loading / empty / error / success via DataTable + Pagination.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn, type SortOrder } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { RoleBadge } from '@/components/domain/RoleBadge';
import { ActiveBadge } from '@/components/domain/ActiveBadge';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { useUsers } from '@/lib/hooks/useUsers';
import type { RoleName, UserDTO } from '@/types/api';

const PAGE_SIZE = 20;

type RoleFilter = '' | RoleName;
type StatusFilter = '' | 'true' | 'false';

function UsersListInner() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [role, setRole] = useState<RoleFilter>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'email' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Debounce the search box into q (§A.2.3).
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      q: debouncedQ || undefined,
      role: role || undefined,
      is_active: status === '' ? undefined : status === 'true',
      sort_by: sortBy,
      sort_order: sortOrder,
    }),
    [page, debouncedQ, role, status, sortBy, sortOrder],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useUsers(params);

  const hasFilters = Boolean(debouncedQ) || role !== '' || status !== '';

  const clearFilters = () => {
    setSearch('');
    setDebouncedQ('');
    setRole('');
    setStatus('');
    setPage(1);
  };

  const columns: DataTableColumn<UserDTO>[] = [
    { key: 'name', header: 'Name', sortKey: 'name', cell: (u) => <span className="font-medium text-slate-900">{u.name}</span> },
    { key: 'email', header: 'Email', sortKey: 'email', cell: (u) => u.email },
    { key: 'role', header: 'Role', cell: (u) => <RoleBadge role={u.role} /> },
    { key: 'active', header: 'Status', cell: (u) => <ActiveBadge active={u.is_active} /> },
    {
      key: 'created_at',
      header: 'Created',
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage every user across roles.</p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => router.push('/users/new')}
        >
          New user
        </Button>
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
              aria-label="Search users"
            />
          </div>
          <Select
            className="w-40"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as RoleFilter);
              setPage(1);
            }}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="PROVIDER">Provider</option>
            <option value="ADMIN">Admin</option>
          </Select>
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
        onRowClick={(u) => router.push(`/users/${u.id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSort}
        emptyTitle="No users match your filters."
        emptyDescription={hasFilters ? 'Try clearing filters to see all users.' : undefined}
        emptyAction={
          hasFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
      />

      <Pagination
        meta={data?.meta}
        onPageChange={(p) => setPage(p)}
      />

      {isFetching && !isLoading && (
        <p className="text-center text-xs text-slate-400">Updating…</p>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell title="Users">
        <UsersListInner />
      </AppShell>
    </ProtectedRoute>
  );
}
