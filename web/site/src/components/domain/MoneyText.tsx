// src/components/domain/MoneyText.tsx (04 §7.4) — renders a DECIMAL money STRING +
// currency without float math, via the shared formatMoney() helper.
import { formatMoney } from '@/lib/format/money';
import { cn } from '@/lib/utils/cn';

export interface MoneyTextProps {
  /** DECIMAL value as a STRING per the API contract (e.g. "79.99"). */
  amount: string | null | undefined;
  currency?: string;
  className?: string;
}

export function MoneyText({ amount, currency = 'USD', className }: MoneyTextProps) {
  return (
    <span className={cn('tabular-nums', className)}>{formatMoney(amount, currency)}</span>
  );
}
