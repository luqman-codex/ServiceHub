// src/components/ui/Card.tsx (04 §7.1, §7.2) — surface container + subparts.
// Uses the design tokens: white surface, slate-200 border, rounded-lg.
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn('flex flex-col gap-1 border-b border-slate-200 px-6 py-4', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-slate-900', className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-slate-500', className)} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn('flex items-center gap-3 border-t border-slate-200 px-6 py-4', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
