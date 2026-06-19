'use client';

// src/app/(auth)/layout.tsx (04 §B.1) — unauthenticated shell for the customer site.
// Centered card layout (sits inside the public Header/Footer from the root layout). If a
// CUSTOMER session already exists, redirect to /account so authed customers never see the
// login/register screens. While auth is bootstrapping we render the loader to avoid
// flashing the form. (Unlike admin, this redirects to /account, not /dashboard.)
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { FullScreenLoader } from '@/components/data';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  const isAuthedCustomer = status === 'authed' && user?.role === 'CUSTOMER';

  useEffect(() => {
    if (isAuthedCustomer) {
      router.replace('/account');
    }
  }, [isAuthedCustomer, router]);

  if (status === 'loading') return <FullScreenLoader label="Loading…" />;
  if (isAuthedCustomer) return null; // avoid flashing the form during the redirect

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">ServiceHub</h1>
            <p className="mt-1 text-sm text-slate-500">Browse, book, and track local services</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
