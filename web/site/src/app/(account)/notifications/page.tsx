'use client';

// src/app/(account)/notifications/page.tsx (04 §B.2.11, C-12 bonus) — the customer's
// notification inbox. GET /notifications (meta.unread_count); PATCH /notifications/:id/read;
// PATCH /notifications/read-all; DELETE /notifications/:id.
// Tapping an unread item marks it read (and deep-links to its booking when present); a
// Mark-all-read action and per-item delete are provided.
// States: skeleton list / "No notifications" / retry / list with unread badge.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/lib/hooks/useNotifications';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState } from '@/components/data/LoadingState';
import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { DateTimeText } from '@/components/domain/DateTimeText';
import { cn } from '@/lib/utils/cn';
import type { NotificationDTO } from '@/types/api';

const PAGE_SIZE = 20;

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  onOpen,
  isDeleting,
}: {
  notification: NotificationDTO;
  onMarkRead: (n: NotificationDTO) => void;
  onDelete: (id: number) => void;
  onOpen: (n: NotificationDTO) => void;
  isDeleting: boolean;
}) {
  const unread = !notification.is_read;
  return (
    <Card
      className={cn(
        'flex items-start gap-3 p-4 transition-colors',
        unread ? 'border-brand/40 bg-brand-light/40' : 'bg-white',
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-md"
      >
        <span
          aria-hidden="true"
          className={cn(
            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
            unread ? 'bg-brand' : 'bg-transparent',
          )}
        />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">
              {notification.title}
            </span>
            {unread && <Badge colorClassName="bg-brand-light text-brand">New</Badge>}
          </span>
          {notification.body && (
            <span className="mt-0.5 block text-sm text-slate-600">{notification.body}</span>
          )}
          <DateTimeText
            value={notification.created_at}
            format="relative"
            className="mt-1 block text-xs text-slate-400"
          />
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        {unread && (
          <Button variant="ghost" size="sm" onClick={() => onMarkRead(notification)}>
            Mark read
          </Button>
        )}
        <IconButton
          label="Delete notification"
          size="sm"
          onClick={() => onDelete(notification.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </Card>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useNotifications({
    page,
    page_size: PAGE_SIZE,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const items = data?.items ?? [];
  const unreadCount = data?.meta.unread_count ?? 0;

  const handleOpen = (n: NotificationDTO) => {
    if (!n.is_read) {
      markRead.mutate(n.id);
    }
    if (n.booking_id != null) {
      router.push(`/bookings/${n.booking_id}`);
    }
  };

  const handleMarkRead = (n: NotificationDTO) => {
    markRead.mutate(n.id);
  };

  const handleDelete = (id: number) => {
    remove.mutate(id, {
      onSuccess: () => toast.success('Notification deleted'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked read'),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge colorClassName="bg-brand-light text-brand">{unreadCount} unread</Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAll}
          isLoading={markAll.isPending}
          disabled={unreadCount === 0}
          leftIcon={<CheckCheck className="h-4 w-4" />}
        >
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <LoadingState variant="lines" rows={6} />
      ) : isError ? (
        <ErrorState
          error={error}
          onRetry={() => void refetch()}
          title="Unable to load notifications"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. Booking updates will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onOpen={handleOpen}
              isDeleting={remove.isPending}
            />
          ))}
        </div>
      )}

      <Pagination meta={data?.meta} onPageChange={setPage} />
    </div>
  );
}
