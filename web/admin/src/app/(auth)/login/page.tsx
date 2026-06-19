// src/app/(auth)/login/page.tsx (04 §A.2.1) — A-1 Admin login.
// Renders the foundation LoginForm inside the centered (auth) shell. LoginForm reads
// useSearchParams() (to honour ?redirect=...), so it is wrapped in a Suspense boundary
// per App Router's CSR-bailout requirement. No client hooks are used directly here, so
// this page stays a Server Component.
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your administrator credentials to continue.
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
