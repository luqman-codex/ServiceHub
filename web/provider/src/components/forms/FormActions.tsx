// src/components/forms/FormActions.tsx (04 §9) — right-aligned action row for form
// footers (submit + cancel). Presentational container only.
import { cn } from '@/lib/utils/cn';

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'right' | 'between';
}

const alignClass: Record<NonNullable<FormActionsProps['align']>, string> = {
  left: 'justify-start',
  right: 'justify-end',
  between: 'justify-between',
};

export function FormActions({ align = 'right', className, children, ...rest }: FormActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-t border-slate-200 pt-4',
        alignClass[align],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
