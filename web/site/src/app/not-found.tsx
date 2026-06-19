// src/app/not-found.tsx (04 §B.1) — 404 screen for the customer site.
// Rendered by Next.js for unmatched routes and explicit notFound() calls. Static and
// server-rendered: a centered card with a link to the public home. The <Link> handles
// navigation without needing client-side hooks.
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <FileQuestion className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
            <p className="mt-1 text-sm text-slate-600">
              The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
