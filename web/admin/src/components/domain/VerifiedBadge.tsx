// src/components/domain/VerifiedBadge.tsx (04 §A.2.10) — provider is_verified indicator.
import { BadgeCheck, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface VerifiedBadgeProps {
  verified: boolean;
  className?: string;
}

export function VerifiedBadge({ verified, className }: VerifiedBadgeProps) {
  return (
    <Badge
      colorClassName={verified ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}
      className={className}
    >
      {verified ? (
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {verified ? 'Verified' : 'Unverified'}
    </Badge>
  );
}
