'use client';

// src/lib/hooks/useNotifications.ts (04 §4) — React Query hooks for the customer
// notifications inbox (C-12). The query uses the qk key factory; mutations invalidate the
// notifications list per the §4.3 matrix so the unread badge stays in sync.
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { qk } from '@/lib/react-query/keys';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationListParams,
  type NotificationListResult,
} from '@/lib/api/notifications';
import type { ApiError } from '@/lib/api/errors';

// C-12 — list own notifications (server scopes to user_id = self). meta.unread_count
// drives the inbox unread badge.
export function useNotifications(
  params: NotificationListParams,
): UseQueryResult<NotificationListResult, ApiError> {
  return useQuery<NotificationListResult, ApiError>({
    queryKey: qk.notifications.list(params as Record<string, unknown>),
    queryFn: () => listNotifications(params),
    placeholderData: (prev) => prev,
  });
}

// PATCH /notifications/:id/read — invalidate the notifications list (§4.3).
export function useMarkNotificationRead(): UseMutationResult<void, ApiError, number> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// PATCH /notifications/read-all — invalidate the notifications list (§4.3).
export function useMarkAllNotificationsRead(): UseMutationResult<void, ApiError, void> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// DELETE /notifications/:id — invalidate the notifications list (§4.3).
export function useDeleteNotification(): UseMutationResult<void, ApiError, number> {
  const qc = useQueryClient();
  return useMutation<void, ApiError, number>({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
