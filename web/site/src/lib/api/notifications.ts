// src/lib/api/notifications.ts — notifications endpoint functions using the shared api
// client (02 §8.10). Bonus C-12 inbox: list own (meta includes unread_count), mark one
// read, mark all read, hard-delete one.
//
// The list response meta carries an extra `unread_count` beyond the standard pagination
// envelope, so this module reads the raw envelope rather than the generic getPage() helper.
import { api } from './client';
import type { NotificationDTO, NotificationType, PaginationMeta } from '@/types/api';

export type NotificationSortBy = 'created_at' | 'is_read';
export type NotificationSortOrder = 'asc' | 'desc';

export interface NotificationListParams {
  page?: number;
  page_size?: number;
  sort_by?: NotificationSortBy;
  sort_order?: NotificationSortOrder;
  is_read?: boolean;
  type?: NotificationType;
}

// The notifications list meta extends the standard pagination meta with unread_count (02 §8.10).
export interface NotificationsMeta extends PaginationMeta {
  unread_count: number;
}

export interface NotificationListResult {
  items: NotificationDTO[];
  meta: NotificationsMeta;
}

// Strip undefined/empty values so we never send blank query params to the API.
function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

// GET /notifications — own list with unread_count in meta.
export async function listNotifications(
  params: NotificationListParams,
): Promise<NotificationListResult> {
  const res = await api.get<{ data: NotificationDTO[]; meta: NotificationsMeta }>(
    '/notifications',
    { params: cleanParams({ ...params }) },
  );
  return { items: res.data.data, meta: res.data.meta };
}

// PATCH /notifications/:id/read — idempotent; sets is_read = true.
export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

// PATCH /notifications/read-all — mark all own notifications read.
export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

// DELETE /notifications/:id — hard delete (204 No Content).
export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}
