'use client';

// src/components/ui/Table.tsx (04 §7.1) — low-level table primitives + a generic
// DataTable that wires the four UI states (loading / empty / error / success) per §7.4.
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { cn } from '@/lib/utils/cn';

export function Table({ className, children, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function THead({ className, children, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500', className)} {...rest}>
      {children}
    </thead>
  );
}

export function TBody({ className, children, ...rest }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-slate-100', className)} {...rest}>
      {children}
    </tbody>
  );
}

export interface TrProps extends React.HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export function Tr({ className, clickable = false, children, ...rest }: TrProps) {
  return (
    <tr
      className={cn(clickable && 'cursor-pointer hover:bg-slate-50', className)}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function Th({ className, children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cn('px-4 py-3 font-medium', className)} {...rest}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-slate-700', className)} {...rest}>
      {children}
    </td>
  );
}

export type SortOrder = 'asc' | 'desc';

export interface DataTableColumn<T> {
  /** Stable column key; when `sortKey` is set the header becomes a sort button. */
  key: string;
  header: React.ReactNode;
  /** Cell renderer. */
  cell: (row: T) => React.ReactNode;
  /** Server-side sort field; enables the sortable header. */
  sortKey?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  /** Current sort state (server-driven). */
  sortBy?: string;
  sortOrder?: SortOrder;
  onSortChange?: (sortBy: string, sortOrder: SortOrder) => void;
  /** Empty-state customization. */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  className?: string;
}

const alignClass: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  isError = false,
  error,
  onRetry,
  onRowClick,
  sortBy,
  sortOrder,
  onSortChange,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState variant="table" rows={6} columns={columns.length} />;
  }
  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortKey || !onSortChange) return;
    const nextOrder: SortOrder =
      sortBy === col.sortKey && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(col.sortKey, nextOrder);
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
      <Table>
        <THead>
          <Tr>
            {columns.map((col) => {
              const isSorted = col.sortKey && sortBy === col.sortKey;
              return (
                <Th key={col.key} className={cn(col.align && alignClass[col.align])}>
                  {col.sortKey ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col)}
                      className="inline-flex items-center gap-1 font-medium uppercase tracking-wide hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      {col.header}
                      {isSorted ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </Th>
              );
            })}
          </Tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Tr
              key={rowKey(row)}
              clickable={Boolean(onRowClick)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <Td key={col.key} className={cn(col.align && alignClass[col.align], col.className)}>
                  {col.cell(row)}
                </Td>
              ))}
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
