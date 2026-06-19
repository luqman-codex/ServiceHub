'use client';

// src/components/ui/Tabs.tsx (04 §7.1) — accessible tab list with keyboard arrows.
// Controlled (value/onValueChange) or uncontrolled (defaultValue).
import { useCallback, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  /** Rendered content for the active tab. */
  children?: React.ReactNode;
}

export function Tabs({ items, value, defaultValue, onValueChange, className, children }: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value ?? '');
  const active = value ?? internal;
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = useCallback(
    (next: string) => {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const enabled = items.filter((i) => !i.disabled);
    const idx = enabled.findIndex((i) => i.value === active);
    if (idx === -1) return;
    let nextIdx = idx;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % enabled.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + enabled.length) % enabled.length;
    else return;
    e.preventDefault();
    const nextValue = enabled[nextIdx].value;
    select(nextValue);
    tabRefs.current[nextValue]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="flex gap-1 border-b border-slate-200"
      >
        {items.map((item) => {
          const isActive = item.value === active;
          return (
            <button
              key={item.value}
              ref={(el) => {
                tabRefs.current[item.value] = el;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={isActive ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.value)}
              className={cn(
                '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {children !== undefined && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active}`}
          aria-labelledby={`${baseId}-tab-${active}`}
          className="pt-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}
