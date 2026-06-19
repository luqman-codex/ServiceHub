import { Order } from 'sequelize';
import { Notification } from '../models';
import { NotificationType } from '../types/enums';
import { AuthUser } from '../types/jwt';
import { PaginationMeta } from '../types/dto';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { buildPaginationMeta, toOffsetLimit } from '../utils/pagination';

/**
 * Notification business logic (02 §8.10, 03 §13 rows 50–53, §15).
 *
 * Every operation is scoped to the authenticated principal: a user reads and
 * manages only their own notifications (`user_id = req.user.id`) for ALL roles,
 * including ADMIN. Ownership is enforced here (the service layer), per 03 §8.3.
 *
 * 404-vs-403 rule (02 §2.4): a notification that does not exist at all → 404;
 * one that exists but belongs to another user → 403.
 */

export interface ListNotificationsQuery {
  page: number;
  page_size: number;
  sort_by: 'created_at' | 'is_read';
  sort_order: 'asc' | 'desc';
  is_read?: boolean;
  type?: NotificationType;
}

/** PaginationMeta plus the notification-specific unread count (02 §8.10). */
export interface NotificationListMeta extends PaginationMeta {
  unread_count: number;
}

export interface ListNotificationsResult {
  rows: Notification[];
  meta: NotificationListMeta;
}

/** GET /notifications — own, filtered, paginated, with `unread_count` in meta. */
export async function listOwn(
  query: ListNotificationsQuery,
  user: AuthUser,
): Promise<ListNotificationsResult> {
  const where: {
    user_id: number;
    is_read?: boolean;
    type?: NotificationType;
  } = { user_id: user.id };
  if (query.is_read !== undefined) where.is_read = query.is_read;
  if (query.type !== undefined) where.type = query.type;

  const { limit, offset } = toOffsetLimit({ page: query.page, page_size: query.page_size });

  const order: Order = [[query.sort_by, query.sort_order.toUpperCase()]];

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order,
    limit,
    offset,
  });

  const unread_count = await Notification.count({
    where: { user_id: user.id, is_read: false },
  });

  const meta: NotificationListMeta = {
    ...buildPaginationMeta({ page: query.page, page_size: query.page_size }, count),
    unread_count,
  };

  return { rows, meta };
}

/** Load a notification and enforce ownership (404 then 403, per 02 §2.4). */
async function loadOwned(id: number, user: AuthUser): Promise<Notification> {
  const notification = await Notification.findByPk(id);
  if (!notification) throw new NotFoundError('Notification not found');
  if (notification.user_id !== user.id)
    throw new ForbiddenError('You do not have access to this notification', 'FORBIDDEN');
  return notification;
}

/** PATCH /notifications/:id/read — mark one own notification as read (idempotent). */
export async function markRead(id: number, user: AuthUser): Promise<Notification> {
  const notification = await loadOwned(id, user);
  if (!notification.is_read) {
    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();
  }
  return notification;
}

/** PATCH /notifications/read-all — mark all own unread notifications as read. */
export async function markAllRead(user: AuthUser): Promise<{ updated: number }> {
  const [updated] = await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: user.id, is_read: false } },
  );
  return { updated };
}

/** DELETE /notifications/:id — hard-delete one own notification (204). */
export async function deleteOwn(id: number, user: AuthUser): Promise<void> {
  const notification = await loadOwned(id, user);
  await notification.destroy();
}
