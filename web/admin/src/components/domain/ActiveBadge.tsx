// src/components/domain/ActiveBadge.tsx (04 §A.2.3, §A.2.6) — is_active indicator.
// Dot + text so color is never the sole signal (§7.4 accessibility).
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

export interface ActiveBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

export function ActiveBadge({
  active,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  className,
}: ActiveBadgeProps) {
  return (
    <Badge
      colorClassName={active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}
      className={className}
    >
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-green-500' : 'bg-slate-400')}
      />
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}
