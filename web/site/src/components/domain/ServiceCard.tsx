// src/components/domain/ServiceCard.tsx (04 §B.2.1, §B.2.5, §7.1) — catalog/featured
// service card used across Home and Browse. Links to the service detail page; shows
// image, name, optional category badge, price (DECIMAL string) and duration.
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MoneyText } from './MoneyText';
import type { ServiceDTO } from '@/types/api';
import { serviceThumb, serviceThumbFallback } from '@/lib/media';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn } from '@/lib/utils/cn';

export interface ServiceCardProps {
  service: ServiceDTO;
  className?: string;
}

function durationLabel(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function ServiceCard({ service, className }: ServiceCardProps) {
  const duration = durationLabel(service.duration_minutes);

  return (
    <Link
      href={`/services/${service.id}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <SmartImage
          src={serviceThumb(service)}
          fallbackSrc={serviceThumbFallback(service)}
          alt={service.name}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {service.category && (
          <Badge color="indigo" className="self-start">
            {service.category.name}
          </Badge>
        )}
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-brand">
          {service.name}
        </h3>
        {service.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{service.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-semibold text-slate-900">
            <MoneyText amount={service.price} currency={service.currency} />
          </span>
          {duration && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {duration}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
