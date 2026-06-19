// src/hooks/queries.ts (05 §8.4)
// React Query read hooks. Each wraps useQuery with a stable, structured query key
// (05 §8.4) and a queryFn that unwraps the 02 §3.1 success envelope ({ success, data, meta }).
// Field names are snake_case to match the wire format (02 §6).
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  BookingDTO,
  BookingStatus,
  CategoryDTO,
  NotificationDTO,
  ServiceDTO,
  UserDTO,
} from '../types/dto';

// Strip undefined/null/'' so we never send blank query params to the API.
function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

// --- Services (02 §8.5) ---

export interface ServiceListFilters {
  category_id?: number;
  is_active?: boolean;
  q?: string;
  page?: number;
  page_size?: number;
}

/** GET /services — list/browse the catalog (eager-loads category by default). */
export function useServices(
  filters: ServiceListFilters = {},
): UseQueryResult<ServiceDTO[], unknown> {
  return useQuery<ServiceDTO[]>({
    queryKey: ['services', filters],
    queryFn: async () => {
      const res = await api.get('/services', {
        params: cleanParams({ include: 'category', page_size: 50, ...filters }),
      });
      return res.data.data as ServiceDTO[];
    },
  });
}

/** GET /services/:id?include=category — single service detail. */
export function useService(id: number): UseQueryResult<ServiceDTO, unknown> {
  return useQuery<ServiceDTO>({
    queryKey: ['service', id],
    queryFn: async () => {
      const res = await api.get(`/services/${id}`, {
        params: { include: 'category' },
      });
      return res.data.data as ServiceDTO;
    },
    enabled: Number.isFinite(id) && id > 0,
  });
}

// --- Categories (02 §8.4) ---

/** GET /categories — filter chips on the Service List screen. */
export function useCategories(): UseQueryResult<CategoryDTO[], unknown> {
  return useQuery<CategoryDTO[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories', {
        params: { is_active: true, page_size: 100 },
      });
      return res.data.data as CategoryDTO[];
    },
  });
}

// --- Bookings (02 §8.6) ---

export interface BookingListFilters {
  status?: BookingStatus;
  page?: number;
  page_size?: number;
}

/** GET /bookings?include=service — the customer's own bookings (server scopes to self). */
export function useBookings(
  filters: BookingListFilters = {},
): UseQueryResult<BookingDTO[], unknown> {
  return useQuery<BookingDTO[]>({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const res = await api.get('/bookings', {
        params: cleanParams({
          include: 'service',
          sort_by: 'scheduled_at',
          sort_order: 'desc',
          page_size: 50,
          ...filters,
        }),
      });
      return res.data.data as BookingDTO[];
    },
  });
}

/** GET /bookings/:id?include=service,provider,payment — one booking with relations. */
export function useBooking(id: number): UseQueryResult<BookingDTO, unknown> {
  return useQuery<BookingDTO>({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await api.get(`/bookings/${id}`, {
        params: { include: 'service,provider,payment' },
      });
      return res.data.data as BookingDTO;
    },
    enabled: Number.isFinite(id) && id > 0,
  });
}

// --- Profile (02 §8.2) ---

/** GET /profile — the signed-in customer's own profile. */
export function useProfile(): UseQueryResult<UserDTO, unknown> {
  return useQuery<UserDTO>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/profile');
      return res.data.data as UserDTO;
    },
  });
}

// --- Notifications (02 §8.10, bonus) ---

export interface NotificationListFilters {
  is_read?: boolean;
  page?: number;
  page_size?: number;
}

/** GET /notifications — own inbox; drives the unread badge (bonus). */
export function useNotifications(
  filters: NotificationListFilters = {},
): UseQueryResult<NotificationDTO[], unknown> {
  return useQuery<NotificationDTO[]>({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const res = await api.get('/notifications', {
        params: cleanParams({ page_size: 50, ...filters }),
      });
      return res.data.data as NotificationDTO[];
    },
  });
}
