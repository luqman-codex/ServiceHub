'use client';

// src/app/(auth)/layout.tsx (04 §A.1, §A.2.1) — unauthenticated shell.
// Centered card layout (no sidebar). If a valid ADMIN session already exists, redirect
// straight to /dashboard so authed admins never see the login screen. While auth is
// bootstrapping we render the full-screen loader to avoid flashing the form.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { FullScreenLoader } from '@/components/data';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  const isAuthedAdmin = status === 'authed' && user?.role === 'ADMIN';

  useEffect(() => {
    if (isAuthedAdmin) {
      router.replace('/dashboard');
    }
  }, [isAuthedAdmin, router]);

  if (status === 'loading') return <FullScreenLoader label="Loading…" />;
  if (isAuthedAdmin) return null; // avoid flashing the form during the redirect

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">ServiceHub Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Operational control panel</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
