'use client';

// src/app/(account)/layout.tsx (04 §B.1, §B.2.8–B.2.11) — the single CUSTOMER gate for
// the account surfaces: /account, /bookings, /bookings/[id], /notifications. Guests are
// bounced to /login?redirect=…; wrong-role (provider/admin) users are sent home. The
// public Header/Footer chrome already wraps every page via the root layout; this layout
// only adds the gate plus an account sub-navigation rail.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarCheck, User as UserIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cn } from '@/lib/utils/cn';

const ACCOUNT_NAV: { href: string; label: string; icon: typeof UserIcon }[] = [
  { href: '/bookings', label: 'My bookings', icon: CalendarCheck },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/account', label: 'Profile', icon: UserIcon },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex flex-wrap gap-1">
      {ACCOUNT_NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              active
                ? 'bg-brand-light text-brand'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="CUSTOMER">
      <div className="space-y-6">
        <AccountNav />
        <div>{children}</div>
      </div>
    </ProtectedRoute>
  );
}
