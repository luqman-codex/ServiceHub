'use client';

// src/lib/hooks/usePayments.ts — React Query hooks for the admin payments list
// (04 §4, §A.2.11). Wraps useQuery with the qk key factory; list filters are part
// of the key so distinct filter sets cache independently.
import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import { listPayments, type ListPaymentsParams } from '@/lib/api/payments';
import type { ApiError } from '@/lib/api/errors';
import type { Page, PaymentDTO } from '@/types/api';

export function usePayments(
  params: ListPaymentsParams,
): UseQueryResult<Page<PaymentDTO>, ApiError> {
  return useQuery<Page<PaymentDTO>, ApiError>({
    queryKey: qk.payments.list(params as Record<string, unknown>),
    queryFn: () => listPayments(params),
    placeholderData: keepPreviousData,
  });
}
