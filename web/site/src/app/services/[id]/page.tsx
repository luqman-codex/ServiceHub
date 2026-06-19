'use client';

// src/app/services/[id]/page.tsx — PUBLIC Service Detail (C-5, 04 §B.2.6).
// GET /services/:id?include=category. Media gallery (preview video + topical images),
// rating, description, "what's included" + "how it works", trust badges, and a sticky
// booking card with a "Book this service" CTA → /book/:id (guests via /login?redirect).
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  CreditCard,
  LayoutGrid,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api, getData } from '@/lib/api/client';
import { qk } from '@/lib/react-query/keys';
import { ApiError } from '@/lib/api/errors';
import type { ServiceDTO } from '@/types/api';
import { useAuth } from '@/lib/auth/useAuth';
import { serviceMedia, serviceRating } from '@/lib/media';
import { MoneyText, DateTimeText, MediaGallery } from '@/components/domain';
import { ErrorState } from '@/components/data';
import { Badge, Button, Card, CardContent, Skeleton } from '@/components/ui';

const INCLUDED = [
  'Background-checked, rated professional',
  'All equipment & supplies included',
  'Up-front pricing — no surprises',
  'Free rescheduling up to the appointment',
  'Secure in-app payment',
  'Satisfaction guarantee',
];

const STEPS = [
  { title: 'Book online', desc: 'Pick a date & time and confirm in seconds.' },
  { title: 'Pro confirms', desc: 'A verified provider accepts and heads your way.' },
  { title: 'Sit back', desc: 'Track status and pay securely when it’s done.' },
];

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
    <div className="grid gap-8 lg:grid-cols-5" aria-hidden="true">
      <div className="space-y-3 lg:col-span-3">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="flex items-center" aria-label={`${value} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={i < full ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4 text-slate-300'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const validId = Number.isFinite(id) && id > 0;

  const { status } = useAuth();
  const { data: service, isLoading, isError, error, refetch } = useService(id);

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

  const duration = service ? durationLabel(service.duration_minutes) : null;
  const rating = service ? serviceRating(service) : null;

  return (
    <section className="space-y-6">
      {backLink}

      {isLoading ? (
        <DetailSkeleton />
      ) : isError ? (
        <ErrorState title="Unable to load service" error={error} onRetry={() => void refetch()} />
      ) : service ? (
        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT: media + content */}
          <div className="space-y-8 lg:col-span-3">
            <MediaGallery items={serviceMedia(service)} />

            <div>
              <h2 className="text-lg font-semibold text-slate-900">What’s included</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
              <ol className="mt-3 grid gap-4 sm:grid-cols-3">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-brand">
                      {i + 1}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* RIGHT: sticky booking card */}
          <div className="lg:col-span-2">
            <div className="space-y-4 lg:sticky lg:top-6">
              {service.category && (
                <Link href={`/services?category_id=${service.category.id}`} className="inline-block">
                  <Badge color="indigo">
                    <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                    {service.category.name}
                  </Badge>
                </Link>
              )}

              <h1 className="text-2xl font-semibold text-slate-900">{service.name}</h1>

              {rating && (
                <div className="flex items-center gap-2 text-sm">
                  <Stars value={Number(rating.rating)} />
                  <span className="font-medium text-slate-900">{rating.rating}</span>
                  <span className="text-slate-400">({rating.reviews} reviews)</span>
                </div>
              )}

              {service.description && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {service.description}
                </p>
              )}

              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-slate-900">
                      <MoneyText amount={service.price} currency={service.currency} />
                    </span>
                    {duration && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {duration}
                      </span>
                    )}
                  </div>

                  <Link href={bookHref} className="block">
                    <Button size="lg" className="w-full" leftIcon={<CalendarPlus className="h-5 w-5" />}>
                      Book this service
                    </Button>
                  </Link>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-[11px] font-medium text-slate-500">
                    <span className="flex flex-col items-center gap-1">
                      <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" />
                      Verified pros
                    </span>
                    <span className="flex flex-col items-center gap-1">
                      <CreditCard className="h-5 w-5 text-brand" aria-hidden="true" />
                      Secure pay
                    </span>
                    <span className="flex flex-col items-center gap-1">
                      <BadgeCheck className="h-5 w-5 text-brand" aria-hidden="true" />
                      Guaranteed
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
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
                  <span className="text-right font-medium text-slate-900">{duration ?? '—'}</span>
                  <span className="text-slate-500">Listed</span>
                  <span className="text-right font-medium text-slate-900">
                    <DateTimeText value={service.created_at} format="date" />
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
