// src/components/data/FullScreenLoader.tsx (04 §3.3, §7.1) — full-viewport spinner
// used by ProtectedRoute while auth status is 'loading' (avoids content flash).
import { Loader2 } from 'lucide-react';

export interface FullScreenLoaderProps {
  label?: string;
}

export function FullScreenLoader({ label = 'Loading…' }: FullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500"
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
