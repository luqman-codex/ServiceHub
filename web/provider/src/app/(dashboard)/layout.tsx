'use client';

// src/app/(dashboard)/layout.tsx — the single PROVIDER gate for all dashboard routes.
// The API enforces real RBAC; this guard is defense-in-UX. Each page renders its own
// <AppShell> (so it can set its own title) — the layout must NOT wrap AppShell here or
// the shell would nest twice.
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="PROVIDER">{children}</ProtectedRoute>;
}
