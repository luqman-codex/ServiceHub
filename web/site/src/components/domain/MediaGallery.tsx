'use client';

// src/components/domain/MediaGallery.tsx — service media slider.
// Shows a preview video first, then images, with prev/next arrows, a dot indicator and a
// thumbnail strip. Pure client component (carousel state). External media via <img>/<video>.
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { MediaItem } from '@/lib/media';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn } from '@/lib/utils/cn';

export interface MediaGalleryProps {
  items: MediaItem[];
  className?: string;
}

export function MediaGallery({ items, className }: MediaGalleryProps) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;

  const current = items[index];
  const go = (delta: number) => setIndex((index + delta + items.length) % items.length);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Main stage */}
      <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        {current.type === 'video' ? (
          <video
            key={current.src}
            src={current.src}
            poster={current.poster}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          <SmartImage
            src={current.src}
            fallbackSrc={current.fallback ?? current.src}
            alt={current.alt}
            className="h-full w-full object-cover"
          />
        )}

        {/* Video badge */}
        {current.type === 'video' && (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            <Play className="h-3 w-3 fill-white" aria-hidden="true" />
            Preview
          </span>
        )}

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next media"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {items.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View ${m.type} ${i + 1}`}
              className={cn(
                'relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition',
                i === index ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <SmartImage
                src={(m.type === 'video' ? m.poster : m.src) ?? ''}
                fallbackSrc={m.fallback ?? ''}
                alt={m.alt}
                className="h-full w-full object-cover"
              />
              {m.type === 'video' && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-4 w-4 fill-white text-white" aria-hidden="true" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
