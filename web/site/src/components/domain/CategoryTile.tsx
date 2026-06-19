// src/components/domain/CategoryTile.tsx (04 §B.2.1, §B.2.4, §7.1) — browse tile for a
// category. Tapping it navigates to the filtered services list (/services?category_id=).
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import type { CategoryDTO } from '@/types/api';
import { cn } from '@/lib/utils/cn';

export interface CategoryTileProps {
  category: CategoryDTO;
  className?: string;
}

export function CategoryTile({ category, className }: CategoryTileProps) {
  return (
    <Link
      href={`/services?category_id=${category.id}`}
      className={cn(
        'group flex flex-col items-center gap-3 rounded-lg border border-slate-200 bg-white p-5 text-center transition-shadow',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-brand-light text-brand">
        {category.icon_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.icon_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <LayoutGrid className="h-6 w-6" aria-hidden="true" />
        )}
      </span>
      <span className="text-sm font-medium text-slate-900 group-hover:text-brand">
        {category.name}
      </span>
      {category.description && (
        <span className="line-clamp-2 text-xs text-slate-500">{category.description}</span>
      )}
    </Link>
  );
}
