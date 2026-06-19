import { Transaction } from 'sequelize';
import { Notification } from '../models';
import { NotificationType } from '../types/enums';

export interface NotifyInput {
  user_id: number;
  booking_id?: number | null;
  type: NotificationType;
  title: string;
  body?: string | null;
}

/** "Dispatches" a push by persisting a notification row (and logging in dev). */
export async function dispatchNotification(input: NotifyInput, tx?: Transaction): Promise<void> {
  await Notification.create(
    {
      user_id: input.user_id,
      booking_id: input.booking_id ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      is_read: false,
    },
    { transaction: tx },
  );
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[mock-push] → user#${input.user_id}: ${input.type} — ${input.title}`);
  }
}
