'use client';

// src/components/layout/Sidebar.tsx (04 §A.1, §7.4) — provider navigation rail.
// Nav items map 1:1 to the provider route tree; active route is highlighted.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Provider portal nav (Dashboard, Jobs, Availability, Profile) — 00 §4.2 P-1..P-9.
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: ClipboardList },
  { href: '/availability', label: 'Availability', icon: CalendarClock },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export interface SidebarProps {
  /** Mobile open state (controlled by AppShell). */
  open?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ open = false, onNavigate, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-slate-200 bg-white',
        className,
      )}
      data-open={open || undefined}
    >
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          SH
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-base font-semibold text-slate-900">ServiceHub</span>
          <span className="text-xs font-medium text-slate-500">Provider</span>
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                active
                  ? 'bg-indigo-50 text-brand'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
