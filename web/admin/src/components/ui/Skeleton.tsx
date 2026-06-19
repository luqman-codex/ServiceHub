// src/components/ui/Skeleton.tsx (04 §7.1, §7.4) — shimmer placeholder block.
// Presentational; used by LoadingState and per-screen skeletons.
import { cn } from '@/lib/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-slate-200', className)}
      {...rest}
    />
  );
}
