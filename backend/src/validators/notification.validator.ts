import { z } from 'zod';
import { NotificationType } from '../types/enums';

/**
 * Validators for the notification resource (02 §8.10, 03 §13 rows 50–53).
 *
 * Only `GET /notifications` carries a query schema; `:id`-bearing routes reuse the
 * shared `idParam` from common.validator.ts, and `read-all` takes no input at all.
 */

/** Boolean filter accepting `true`/`false` strings (02 §7.3). */
const booleanFilter = z
  .enum(['true', 'false'])
  .transform((s) => s === 'true');

/** GET /notifications — list own notifications (02 §8.10). */
export const listNotifications = {
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.enum(['created_at', 'is_read']).default('created_at'),
    sort_order: z
      .enum(['asc', 'desc'])
      .or(z.enum(['ASC', 'DESC']).transform((s) => s.toLowerCase() as 'asc' | 'desc'))
      .default('desc'),
    is_read: booleanFilter.optional(),
    type: z.nativeEnum(NotificationType).optional(),
  }),
};
