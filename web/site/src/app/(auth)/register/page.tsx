// src/app/(auth)/register/page.tsx (04 §B.2.2, C-1) — self-service signup.
// Renders the shared <RegisterForm/> (RHF + zod; POST /auth/register always creates a
// CUSTOMER and returns an AuthResultDTO → auto-login). RegisterForm reads ?redirect= via
// useSearchParams(), so it is wrapped in <Suspense> per Next.js rules.
import { Suspense } from 'react';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { LoadingState } from '@/components/data';

export const metadata = {
  title: 'Create account · ServiceHub',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-900">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">Sign up to book and track services.</p>
      </div>

      <Suspense fallback={<LoadingState variant="lines" rows={4} />}>
        <RegisterForm />
      </Suspense>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:text-brand-hover">
          Sign in
        </Link>
      </p>
    </div>
  );
}
