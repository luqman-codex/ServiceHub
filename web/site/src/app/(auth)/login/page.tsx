// src/app/(auth)/login/page.tsx (04 §B.2.3, C-2) — customer login.
// Renders the shared <LoginForm/> (RHF + zod; POST /auth/login → AuthResultDTO, then
// useAuth().login). The site does NOT role-gate the login itself — any active account is
// accepted; (account)/* routes enforce CUSTOMER via <ProtectedRoute>. LoginForm reads
// ?redirect= via useSearchParams(), so it is wrapped in <Suspense> per Next.js rules.
import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoadingState } from '@/components/data';

export const metadata = {
  title: 'Sign in · ServiceHub',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
        <p className="mt-1 text-sm text-slate-500">Welcome back — sign in to continue.</p>
      </div>

      <Suspense fallback={<LoadingState variant="lines" rows={3} />}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-slate-600">
        Don&rsquo;t have an account?{' '}
        <Link href="/register" className="font-medium text-brand hover:text-brand-hover">
          Create account
        </Link>
      </p>
    </div>
  );
}
