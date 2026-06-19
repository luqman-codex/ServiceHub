// src/app/(auth)/login/page.tsx (04 §A.2.1) — P-1 Provider login.
// Renders the foundation LoginForm inside the centered (auth) shell. LoginForm reads
// useSearchParams() (to honour ?redirect=...), so it is wrapped in a Suspense boundary
// per App Router's CSR-bailout requirement. The form rejects non-PROVIDER accounts at
// the UI layer ("This portal is for service providers only."). No client hooks are used
// directly here, so this page stays a Server Component.
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your provider credentials to manage your jobs.
        </p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
