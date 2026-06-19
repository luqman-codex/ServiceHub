// src/components/domain/RoleBadge.tsx (04 §A.2.3) — user role pill (CUSTOMER|PROVIDER|ADMIN).
import { Badge } from '@/components/ui/Badge';
import type { RoleName } from '@/types/api';

const ROLE_COLOR: Record<RoleName, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  PROVIDER: 'bg-indigo-100 text-indigo-800',
  ADMIN: 'bg-purple-100 text-purple-800',
};

const ROLE_LABEL: Record<RoleName, string> = {
  CUSTOMER: 'Customer',
  PROVIDER: 'Provider',
  ADMIN: 'Admin',
};

export interface RoleBadgeProps {
  role: RoleName;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <Badge colorClassName={ROLE_COLOR[role]} className={className}>
      {ROLE_LABEL[role]}
    </Badge>
  );
}
