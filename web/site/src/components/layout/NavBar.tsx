'use client';

// src/components/layout/NavBar.tsx (04 §7.1 Layout, §7.4) — primary site navigation.
// Public links (Home / Categories / Services) with the active route highlighted.
// Consumed by Header for desktop (horizontal) and the mobile menu (stacked).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export interface NavBarProps {
  orientation?: 'horizontal' | 'vertical';
  onNavigate?: () => void;
  className?: string;
}

export const NAV_LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/categories', label: 'Categories' },
  { href: '/services', label: 'Services' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar({ orientation = 'horizontal', onNavigate, className }: NavBarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        orientation === 'horizontal' ? 'flex items-center gap-1' : 'flex flex-col gap-1',
        className,
      )}
    >
      {NAV_LINKS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              active ? 'bg-brand-light text-brand' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
