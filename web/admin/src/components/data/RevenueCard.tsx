'use client';

// src/components/data/RevenueCard.tsx (04 §8) — read-only mocked revenue widget.
// Money rendered as STRING via MoneyText (no float math), per the API contract.
import { DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MoneyText } from '@/components/domain/MoneyText';

export interface RevenueCardProps {
  currency: string;
  completedTotal: string; // DECIMAL as STRING
  paidTotal: string; // DECIMAL as STRING
  className?: string;
}

export function RevenueCard({ currency, completedTotal, paidTotal, className }: RevenueCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Revenue</CardTitle>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
          <DollarSign className="h-5 w-5" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            <MoneyText amount={completedTotal} currency={currency} />
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Paid</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            <MoneyText amount={paidTotal} currency={currency} />
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
