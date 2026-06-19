'use client';

// src/components/layout/Header.tsx (04 §7.1 Layout, §B) — PUBLIC site chrome (NOT an
// admin sidebar). Logo + NavBar (Home / Categories / Services) + auth area: a UserMenu
// dropdown for authenticated customers or Login / Sign-up links for guests. The mobile
// menu collapses the nav behind a toggle. While auth status is 'loading' the auth area
// stays neutral (no flash).
import { useState } from 'react';
import Link from 'next/link';
import { LogIn, Menu, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { NavBar } from './NavBar';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/utils/cn';

export interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { status } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthed = status === 'authed';
  const isGuest = status === 'guest';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg text-lg font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            ServiceHub
          </Link>
          <div className="hidden md:block">
            <NavBar orientation="horizontal" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {isAuthed && <UserMenu />}
            {isGuest && (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" leftIcon={<LogIn className="h-4 w-4" />}>
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <NavBar orientation="vertical" onNavigate={() => setMobileOpen(false)} />
          <div className="mt-3 border-t border-slate-100 pt-3">
            {isAuthed && <UserMenu />}
            {isGuest && (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" fullWidth leftIcon={<LogIn className="h-4 w-4" />}>
                    Log in
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" fullWidth>
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
