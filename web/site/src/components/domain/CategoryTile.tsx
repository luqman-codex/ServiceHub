// src/components/domain/CategoryTile.tsx (04 §B.2.1, §B.2.4, §7.1) — browse tile for a
// category. Tapping it navigates to the filtered services list (/services?category_id=).
// Shows a topical image header with the category name overlaid.
import Link from 'next/link';
import type { CategoryDTO } from '@/types/api';
import { categoryImage, categoryImageFallback } from '@/lib/media';
import { SmartImage } from '@/components/ui/SmartImage';
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
        'group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <SmartImage
          src={category.icon_url ?? categoryImage(category)}
          fallbackSrc={categoryImageFallback(category)}
          alt={category.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className="absolute bottom-2 left-3 right-3 text-base font-semibold text-white drop-shadow">
          {category.name}
        </span>
      </div>
      {category.description && (
        <span className="line-clamp-2 p-3 text-xs text-slate-500">{category.description}</span>
      )}
    </Link>
  );
}
