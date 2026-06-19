'use client';

// src/components/data/StatCard.tsx (04 §8) — dashboard metric card. Clickable cards
// navigate to a filtered list; supports loading + error degradation per widget.
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Optional secondary line under the value (e.g. "12 active"). */
  hint?: React.ReactNode;
  /** Navigates on click (e.g. "/jobs?status=PENDING"). */
  href?: string;
  isLoading?: boolean;
  /** Accent classes for the icon chip (e.g. status colors from §7.3). */
  accentClassName?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  href,
  isLoading = false,
  accentClassName = 'bg-indigo-50 text-brand',
  className,
}: StatCardProps) {
  const inner = (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 transition-shadow',
        href && 'hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        )}
        {hint && !isLoading && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {Icon && (
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', accentClassName)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
