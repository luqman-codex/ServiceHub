'use client';

// src/components/layout/UserMenu.tsx (04 §7.1 Layout, §B) — authenticated customer
// dropdown: account, bookings, notifications + logout (via useAuth). Closes on outside
// click / Escape. For guests the Header renders Login/Sign-up links instead.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CalendarCheck, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { cn } from '@/lib/utils/cn';

export interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const initial = user.name?.trim().charAt(0).toUpperCase() || 'U';

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.replace('/');
  };

  const items = [
    { href: '/account', label: 'My account', icon: UserIcon },
    { href: '/bookings', label: 'My bookings', icon: CalendarCheck },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700',
          'transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-sm font-semibold text-brand">
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{user.name}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
