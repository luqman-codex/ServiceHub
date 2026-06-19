'use client';

// src/components/ui/Pagination.tsx (04 §7.1) — page navigation footer driven by
// the API PaginationMeta envelope (02 §7). Renders prev/next + page indicator.
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@/types/api';
import { Button } from './Button';
import { cn } from '@/lib/utils/cn';

export interface PaginationProps {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ meta, onPageChange, className }: PaginationProps) {
  // Show nothing only when there is no data at all. When there IS data we always render
  // the result summary (so server-side pagination state is visible even on a single
  // page); the prev/next controls appear once there is more than one page.
  if (!meta || meta.total_items === 0) return null;

  const { page, total_pages, total_items, page_size, has_next, has_prev } = meta;
  const firstItem = (page - 1) * page_size + 1;
  const lastItem = Math.min(page * page_size, total_items);

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col items-center justify-between gap-3 px-1 py-3 text-sm text-slate-600 sm:flex-row',
        className,
      )}
    >
      <p>
        Showing <span className="font-medium text-slate-900">{firstItem}</span>–
        <span className="font-medium text-slate-900">{lastItem}</span> of{' '}
        <span className="font-medium text-slate-900">{total_items}</span>
      </p>
      {total_pages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!has_prev}
            onClick={() => onPageChange(page - 1)}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Previous
          </Button>
          <span className="px-2" aria-current="page">
            Page <span className="font-medium text-slate-900">{page}</span> of {total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!has_next}
            onClick={() => onPageChange(page + 1)}
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      )}
    </nav>
  );
}
