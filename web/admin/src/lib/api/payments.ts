// src/lib/api/payments.ts — payments endpoint functions using the shared api client.
// Admin-only: lists mocked payment records across bookings (02 §8.9, endpoints 48-49).
import { api, getPage, getData } from './client';
import type {
  Page,
  PaymentDTO,
  PaymentMethod,
  PaymentStatus,
} from '@/types/api';

export type PaymentSortBy = 'id' | 'created_at' | 'paid_at';
export type PaymentSortOrder = 'asc' | 'desc';

// Query params accepted by GET /payments (02 §8.9). Empty/undefined values are omitted.
export interface ListPaymentsParams {
  page?: number;
  page_size?: number;
  sort_by?: PaymentSortBy;
  sort_order?: PaymentSortOrder;
  status?: PaymentStatus;
  method?: PaymentMethod;
  booking_id?: number;
}

/** Strip empty-string / null / undefined params so the API only sees real filters. */
function cleanParams(params: ListPaymentsParams): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    out[key] = value as string | number;
  }
  return out;
}

export function listPayments(params: ListPaymentsParams): Promise<Page<PaymentDTO>> {
  return getPage<PaymentDTO>(api.get('/payments', { params: cleanParams(params) }));
}

export function getPayment(id: number): Promise<PaymentDTO> {
  return getData<PaymentDTO>(api.get(`/payments/${id}`));
}
