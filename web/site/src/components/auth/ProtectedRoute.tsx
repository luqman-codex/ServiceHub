'use client';

// src/components/auth/ProtectedRoute.tsx (04 §3.3)
// Client-side route guard for the site's (account)/* and /book/* surfaces.
// The API enforces real RBAC; this is defense-in-UX.
//   guest      → /login?redirect=<current path>
//   wrong role → / (site rule; admin app would send to /login)
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import type { RoleName } from '@/types/api';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export function ProtectedRoute({
  requiredRole = 'CUSTOMER',
  children,
}: {
  requiredRole?: RoleName;
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === 'guest') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (status === 'authed' && user && user.role !== requiredRole) {
      // wrong role on the site: send home (admin app would clear token → /login)
      router.replace(requiredRole === 'ADMIN' ? '/login' : '/');
    }
  }, [status, user, requiredRole, router, pathname]);

  if (status === 'loading') return <FullScreenLoader />;
  if (status !== 'authed' || user?.role !== requiredRole) return null; // avoid flash
  return <>{children}</>;
}
