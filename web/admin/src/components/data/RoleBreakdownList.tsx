'use client';

// src/components/data/RoleBreakdownList.tsx (04 §8) — users-by-role list.
// Each row links to /users?role=<R>.
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { RoleName } from '@/types/api';

const ROLE_ORDER: RoleName[] = ['CUSTOMER', 'PROVIDER', 'ADMIN'];

const ROLE_LABEL: Record<RoleName, string> = {
  CUSTOMER: 'Customers',
  PROVIDER: 'Providers',
  ADMIN: 'Admins',
};

const ROLE_DOT: Record<RoleName, string> = {
  CUSTOMER: 'bg-blue-500',
  PROVIDER: 'bg-indigo-500',
  ADMIN: 'bg-purple-500',
};

export interface RoleBreakdownListProps {
  byRole: Record<RoleName, number>;
  className?: string;
}

export function RoleBreakdownList({ byRole, className }: RoleBreakdownListProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Users by role</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100">
          {ROLE_ORDER.map((role) => (
            <li key={role}>
              <Link
                href={`/users?role=${role}`}
                className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${ROLE_DOT[role]}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-700">{ROLE_LABEL[role]}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-slate-900">
                    {byRole[role] ?? 0}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
