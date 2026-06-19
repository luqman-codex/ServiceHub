'use client';

// src/app/(dashboard)/layout.tsx (04 §A.1, §3.3) — the single ADMIN gate for all
// dashboard routes. Wraps every authenticated screen in the sidebar/topbar shell.
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
