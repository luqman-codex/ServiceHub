'use client';

// src/app/(dashboard)/layout.tsx (04 §A.1, §3.3) — the single ADMIN gate for all
// dashboard routes. The sidebar/topbar shell (<AppShell>) is rendered by each page so
// it can set its own title; the layout must NOT also wrap in AppShell or it nests twice.
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
}
