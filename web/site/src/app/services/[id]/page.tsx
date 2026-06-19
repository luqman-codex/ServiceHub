'use client';

// src/app/services/[id]/page.tsx — PUBLIC Service Detail (C-5, 04 §B.2.6).
// GET /services/:id?include=category. Shows name, description, price, currency, duration
// and category, plus a "Book this service" CTA → /book/:id (guests are routed through
// /login?redirect=/book/:id). Renders loading (skeleton), error/404, and success states.
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarPlus, Clock, ImageOff, LayoutGrid } from 'lucide-react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api, getData } from '@/lib/api/client';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import type { ServiceDTO } from '@/types/api';
import { useAuth } from '@/lib/auth/useAuth';
import { MoneyText, DateTimeText } from '@/components/domain';
import { ErrorState } from '@/components/data';
import { Badge, Button, Card, CardContent, Skeleton } from '@/components/ui';

function durationLabel(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

function useService(id: number): UseQueryResult<ServiceDTO, ApiError> {
  return useQuery<ServiceDTO, ApiError>({
    queryKey: qk.services.detail(id),
    queryFn: () =>
      getData<ServiceDTO>(api.get(`/services/${id}`, { params: { include: 'category' } })),
    enabled: Number.isFinite(id) && id > 0,
  });
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2" aria-hidden="true">
      <Skeleton className="aspect-[16/10] w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const validId = Number.isFinite(id) && id > 0;

  const { status } = useAuth();
  const { data: service, isLoading, isError, error, refetch } = useService(id);

  // Guests are sent to login first, then bounced to the booking form (§B.2.6 actions).
  const bookHref = validId
    ? status === 'authed'
      ? `/book/${id}`
      : `/login?redirect=${encodeURIComponent(`/book/${id}`)}`
    : '/services';

  const backLink = (
    <Link
      href="/services"
      className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to services
    </Link>
  );

  // Invalid route id, or a 404 from the API → "Service not found".
  const notFound = !validId || (isError && error instanceof ApiError && error.status === 404);

  if (notFound) {
    return (
      <section className="space-y-6">
        {backLink}
        <ErrorState
          title="Service not found"
          error={
            !validId
              ? 'This service does not exist.'
              : 'This service may have been removed or is no longer available.'
          }
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {backLink}

      {isLoading ? (
        <DetailSkeleton />
      ) : isError ? (
        <ErrorState
          title="Unable to load service"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : service ? (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Media */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {service.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.image_url}
                alt={service.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageOff className="h-10 w-10" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4">
            {service.category && (
              <Link href={`/services?category_id=${service.category.id}`} className="self-start">
                <Badge color="indigo">
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                  {service.category.name}
                </Badge>
              </Link>
            )}

            <h1 className="text-2xl font-semibold text-slate-900">{service.name}</h1>

            <div className="flex flex-wrap items-center gap-4">
              <span className="text-2xl font-semibold text-slate-900">
                <MoneyText amount={service.price} currency={service.currency} />
              </span>
              {durationLabel(service.duration_minutes) && (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {durationLabel(service.duration_minutes)}
                </span>
              )}
            </div>

            {service.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {service.description}
              </p>
            )}

            <Card className="mt-2">
              <CardContent className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-slate-500">Category</span>
                <span className="text-right font-medium text-slate-900">
                  {service.category?.name ?? '—'}
                </span>
                <span className="text-slate-500">Price</span>
                <span className="text-right font-medium text-slate-900">
                  <MoneyText amount={service.price} currency={service.currency} />
                </span>
                <span className="text-slate-500">Duration</span>
                <span className="text-right font-medium text-slate-900">
                  {durationLabel(service.duration_minutes) ?? '—'}
                </span>
                <span className="text-slate-500">Listed</span>
                <span className="text-right font-medium text-slate-900">
                  <DateTimeText value={service.created_at} format="date" />
                </span>
              </CardContent>
            </Card>

            <div className="mt-2">
              <Link href={bookHref}>
                <Button size="lg" leftIcon={<CalendarPlus className="h-5 w-5" />}>
                  Book this service
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
