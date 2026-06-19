import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { serializeNotification } from '../utils/serializers';
import * as notificationService from '../services/notification.service';
import { ListNotificationsQuery } from '../services/notification.service';

/**
 * Notification controllers (03 §13 rows 50–53). Thin: each handler reads
 * `req.user`/`req.params`/validated `req.query`, calls ONE service method, and
 * sends the standard success envelope. No business rules live here.
 */

// GET /notifications — list own notifications (paginated + unread_count in meta)
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { rows, meta } = await notificationService.listOwn(
    req.query as unknown as ListNotificationsQuery,
    req.user!,
  );
  res.json({ success: true, data: rows.map(serializeNotification), meta });
});

// PATCH /notifications/:id/read — mark one as read
export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.markRead(Number(req.params.id), req.user!);
  res.json({ success: true, data: serializeNotification(notification) });
});

// PATCH /notifications/read-all — mark all own as read
export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.markAllRead(req.user!);
  res.json({ success: true, data: result });
});

// DELETE /notifications/:id — hard-delete one own notification (204, no body)
export const remove = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.deleteOwn(Number(req.params.id), req.user!);
  res.status(204).send();
});
