'use client';

// src/app/page.tsx (04 §B.2.1) — Home (discovery). PUBLIC: renders without auth.
// Hero + search entry, category tiles, and featured (newest) services.
//   GET /categories?is_active=true
//   GET /services?page_size=8&sort_by=created_at&sort_order=desc&include=category
// Each data section owns its query and renders all four UI states (loading / empty /
// error / success) independently so one failing section never blanks the page.
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, LayoutGrid, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryTile } from '@/components/domain/CategoryTile';
import { ServiceCard } from '@/components/domain/ServiceCard';
import { EmptyState, ErrorState } from '@/components/data';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCategories } from '@/lib/hooks/useCategories';
import { useServices } from '@/lib/hooks/useServices';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const categoriesQuery = useCategories({
    is_active: true,
    page_size: 12,
    sort_by: 'name',
    sort_order: 'asc',
  });

  const servicesQuery = useServices({
    page_size: 8,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const onSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/services?q=${encodeURIComponent(trimmed)}` : '/services');
  };

  const categories = categoriesQuery.data?.items ?? [];
  const services = servicesQuery.data?.items ?? [];

  return (
    <div className="space-y-12">
      {/* Hero + search */}
      <section className="rounded-2xl bg-gradient-to-br from-brand to-indigo-700 px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Book trusted local services
          </h1>
          <p className="mt-3 text-base text-indigo-100 sm:text-lg">
            Browse categories, compare services, and book in a few taps.
          </p>
          <form onSubmit={onSearch} className="mt-6 flex max-w-md gap-2">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services…"
              aria-label="Search services"
              leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
              className="text-slate-900"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Browse categories</h2>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {categoriesQuery.isLoading ? (
          <div
            role="status"
            aria-label="Loading categories"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <ErrorState
            error={categoriesQuery.error}
            title="Couldn't load categories"
            onRetry={() => categoriesQuery.refetch()}
          />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="No categories yet"
            description="Check back soon — new categories are on the way."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* Featured services */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Featured services</h2>
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover"
          >
            Browse all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {servicesQuery.isLoading ? (
          <div
            role="status"
            aria-label="Loading services"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : servicesQuery.isError ? (
          <ErrorState
            error={servicesQuery.error}
            title="Couldn't load services"
            onRetry={() => servicesQuery.refetch()}
          />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No services available yet."
            description="There are no services to show right now. Please check back later."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
