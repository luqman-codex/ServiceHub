'use client';

// src/components/ui/SmartImage.tsx — an <img> that swaps to a reliable fallback source if
// the primary fails to load. Used for demo media (loremflickr is topical but can be flaky
// under a burst of requests; the fallback is a stable Picsum photo), so the UI never shows
// a broken image.
import { useEffect, useState } from 'react';

export interface SmartImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function SmartImage({ src, fallbackSrc, alt, className, loading = 'lazy' }: SmartImageProps) {
  const [current, setCurrent] = useState(src);
  const [loaded, setLoaded] = useState(false);

  // Reset when the primary src changes (e.g. switching gallery slides).
  useEffect(() => {
    setCurrent(src);
    setLoaded(false);
  }, [src]);

  // If the topical source neither loads nor errors within a few seconds (loremflickr can
  // be slow under a burst), fall back to the fast, reliable source so no tile stays blank.
  useEffect(() => {
    if (loaded || current === fallbackSrc || !fallbackSrc) return;
    const t = setTimeout(() => setCurrent(fallbackSrc), 4000);
    return () => clearTimeout(t);
  }, [current, loaded, fallbackSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      loading={loading}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (current !== fallbackSrc && fallbackSrc) setCurrent(fallbackSrc);
      }}
    />
  );
}
