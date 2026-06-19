'use client';

// src/components/layout/Topbar.tsx (04 §A.1, §7.4) — sticky header above page content.
// Holds the mobile sidebar toggle, page title slot, and the UserMenu.
import { Menu } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/utils/cn';

export interface TopbarProps {
  title?: React.ReactNode;
  onMenuClick?: () => void;
  className?: string;
}

export function Topbar({ title, onMenuClick, className }: TopbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <IconButton label="Open navigation" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </IconButton>
        )}
        {title && <h1 className="text-lg font-semibold text-slate-900">{title}</h1>}
      </div>
      <UserMenu />
    </header>
  );
}
