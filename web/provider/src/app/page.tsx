'use client';

// src/app/page.tsx (04 §A.1) — root index route for the PROVIDER portal.
// "/" → redirect to /dashboard (if authed PROVIDER) or /login. Auth status lives in the
// AuthProvider (client), so this is a client component that reacts to it. While the
// session is bootstrapping we show the full-screen loader to avoid a flash.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { FullScreenLoader } from '@/components/data';

export default function RootPage() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authed' && user?.role === 'PROVIDER') {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [status, user, router]);

  return <FullScreenLoader label="Loading ServiceHub…" />;
}
