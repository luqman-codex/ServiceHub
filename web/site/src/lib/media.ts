// src/lib/media.ts — demo media resolver.
// Topical images are bundled locally under /public/media (instant, reliable, offline), so
// every service shows category-appropriate imagery with no runtime dependency on an image
// API. A real service.image_url still takes precedence. The preview video is a stable
// public sample with a local topical poster frame.
import type { ServiceDTO, CategoryDTO } from '@/types/api';

// A small pool of reliable public sample clips, varied per service so the preview is not
// always the same. (Topical stock video needs a keyed API; these are stable demo clips
// shown behind a topical poster frame.)
const VIDEOS = [
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/movie.mp4',
  'https://vjs.zencdn.net/v/oceans.mp4',
  'https://media.w3.org/2010/05/video/movie_300.mp4',
  'https://download.samplelib.com/mp4/sample-10s.mp4',
];

// 12 bundled topical photos per category (public/media/<cat>-1..12.jpg).
const PER_CATEGORY = 12;
const mk = (cat: string) =>
  Array.from({ length: PER_CATEGORY }, (_, i) => `/media/${cat}-${i + 1}.jpg`);
const SETS: Record<string, string[]> = {
  cleaning: mk('cleaning'),
  plumbing: mk('plumbing'),
  electrical: mk('electrical'),
  salon: mk('salon'),
  home: mk('home'),
};

function setFor(category?: { slug?: string; name?: string } | null): string[] {
  const slug = category?.slug ?? '';
  const name = (category?.name ?? '').toLowerCase();
  if (slug === 'cleaning' || name.includes('clean')) return SETS.cleaning;
  if (slug === 'plumbing' || name.includes('plumb')) return SETS.plumbing;
  if (slug === 'electrical' || name.includes('electr')) return SETS.electrical;
  if (slug === 'salon-at-home' || name.includes('salon') || name.includes('beauty')) return SETS.salon;
  return SETS.home;
}

// Rotate a set deterministically by id so two services in the same category lead with
// different images.
function rotate(arr: string[], by: number): string[] {
  const n = arr.length;
  const k = ((by % n) + n) % n;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

export interface MediaItem {
  type: 'video' | 'image';
  src: string;
  poster?: string;
  fallback?: string;
  alt: string;
}

/** Gallery for the service-detail slider: a preview video first, then topical images. */
export function serviceMedia(service: ServiceDTO): MediaItem[] {
  const base = setFor(service.category);
  const imgs = rotate(base, service.id);
  const video = VIDEOS[service.id % VIDEOS.length];
  const items: MediaItem[] = [
    // Poster/hero is always the category's strongest curated photo (base[0]).
    { type: 'video', src: video, poster: base[0], fallback: base[0], alt: `${service.name} preview` },
  ];
  if (service.image_url) {
    items.push({ type: 'image', src: service.image_url, fallback: imgs[0], alt: service.name });
  }
  imgs.forEach((src, i) =>
    items.push({ type: 'image', src, fallback: imgs[(i + 1) % imgs.length], alt: `${service.name} photo ${i + 1}` }),
  );
  return items;
}

/** Single thumbnail for service cards. */
export function serviceThumb(service: ServiceDTO): string {
  return service.image_url ?? rotate(setFor(service.category), service.id)[0];
}

/** Reliable fallback thumbnail (a different image from the same category set). */
export function serviceThumbFallback(service: ServiceDTO): string {
  const imgs = setFor(service.category);
  return imgs[(service.id + 1) % imgs.length];
}

/** Image for a category tile. */
export function categoryImage(category: CategoryDTO): string {
  return setFor(category)[0];
}

export function categoryImageFallback(category: CategoryDTO): string {
  return setFor(category)[1 % setFor(category).length];
}

/** Stable pseudo-rating (4.6–4.9 + review count) derived from the id, for demo polish. */
export function serviceRating(service: ServiceDTO): { rating: string; reviews: number } {
  const r = 4.6 + ((service.id * 7) % 4) / 10; // 4.6 .. 4.9
  const reviews = 40 + ((service.id * 37) % 260); // 40 .. 299
  return { rating: r.toFixed(1), reviews };
}
