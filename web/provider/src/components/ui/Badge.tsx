// src/components/ui/Badge.tsx (04 §7.1) — small pill label. Presentational only;
// color is never the sole signal (always carries text, per §7.4 accessibility).
import { cn } from '@/lib/utils/cn';

export type BadgeColor =
  | 'slate'
  | 'amber'
  | 'blue'
  | 'indigo'
  | 'green'
  | 'red'
  | 'purple';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  /** Pass exact Tailwind classes to override the preset color (e.g. status maps in §7.3). */
  colorClassName?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ color = 'slate', colorClassName, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClassName ?? colorClasses[color],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
