import { Order, Transaction, WhereOptions } from 'sequelize';
import { sequelize, Booking, Payment } from '../models';
import { NotificationType, PaymentMethod, PaymentStatus, RoleName } from '../types/enums';
import { AuthUser } from '../types/jwt';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors';
import { dispatchNotification } from '../utils/notification.mock';
import { mockCharge } from '../utils/payment.mock';
import { buildPaginationMeta, toOffsetLimit } from '../utils/pagination';
import { PaginationMeta } from '../types/dto';
import { CreatePaymentBody, ListPaymentsQuery } from '../validators/payment.validator';

/**
 * Payment service (03 §13 rows 46–49, §14 mocked gateway).
 *
 * One mocked payment per booking (uq_payments_booking_id); `amount`/`currency`
 * are always snapshotted from the booking (01 §10.6; 02 §8.9). Ownership for
 * CUSTOMER (own booking only) is enforced here; ADMIN has full scope.
 */

/** Load a booking enforcing the CUSTOMER own-record rule (02 §2.4: 404 vs 403). */
async function loadBookingScoped(
  bookingId: number,
  user: AuthUser,
  tx?: Transaction,
): Promise<Booking> {
  const booking = await Booking.findByPk(bookingId, { transaction: tx });
  if (!booking) throw new NotFoundError('Booking not found');
  if (user.role !== RoleName.ADMIN && booking.customer_id !== user.id) {
    throw new ForbiddenError('You do not have access to this booking');
  }
  return booking;
}

/**
 * POST /bookings/:id/payment — create/record a mocked payment (03 §14).
 *  1. Load booking; 404 if missing; CUSTOMER ownership else 403 (ADMIN any).
 *  2. 409 PAYMENT_ALREADY_EXISTS if a payment already exists for the booking.
 *  3. amount/currency are server-set from the booking (client amount ignored).
 *  4. Resolve method (default MOCK) & status (default PAID); mockCharge derives
 *     transaction_ref + paid_at. A client-supplied transaction_ref is checked for
 *     uniqueness → 409 DUPLICATE_RESOURCE.
 *  5. Persist inside a transaction; emit a PAYMENT notification to the customer.
 */
export async function createForBooking(
  bookingId: number,
  body: CreatePaymentBody,
  user: AuthUser,
): Promise<Payment> {
  return sequelize.transaction(async (tx: Transaction) => {
    const booking = await loadBookingScoped(bookingId, user, tx);

    const existing = await Payment.findOne({
      where: { booking_id: booking.id },
      transaction: tx,
    });
    if (existing) {
      throw new ConflictError('A payment already exists for this booking', 'PAYMENT_ALREADY_EXISTS');
    }

    const method: PaymentMethod = body.method ?? PaymentMethod.MOCK;
    const status: PaymentStatus = body.status ?? PaymentStatus.PAID;

    // Server-set amount/currency from the booking snapshot (01 §10.6).
    const amount = Number(booking.total_price);
    const currency = booking.currency;

    const charge = mockCharge({ amount, currency, method }, status);

    // Honor a client-supplied transaction_ref; otherwise use the mocked one.
    const transactionRef =
      body.transaction_ref === undefined || body.transaction_ref === null
        ? charge.transaction_ref
        : body.transaction_ref;

    if (body.transaction_ref) {
      const dupe = await Payment.findOne({
        where: { transaction_ref: body.transaction_ref },
        transaction: tx,
      });
      if (dupe) {
        throw new ConflictError('Transaction reference already exists', 'DUPLICATE_RESOURCE');
      }
    }

    const payment = await Payment.create(
      {
        booking_id: booking.id,
        amount,
        currency,
        method,
        status: charge.status,
        transaction_ref: transactionRef,
        paid_at: charge.status === PaymentStatus.PAID ? (charge.paid_at ?? new Date()) : null,
      },
      { transaction: tx },
    );

    await dispatchNotification(
      {
        user_id: booking.customer_id,
        booking_id: booking.id,
        type: NotificationType.PAYMENT,
        title: 'Payment recorded',
        body: `A payment of ${amount.toFixed(2)} ${currency} was recorded as ${charge.status}.`,
      },
      tx,
    );

    return payment;
  });
}

/**
 * GET /bookings/:id/payment — fetch the payment for a booking.
 * CUSTOMER own booking only; ADMIN any. 404 if no booking OR no payment.
 */
export async function getForBooking(bookingId: number, user: AuthUser): Promise<Payment> {
  const booking = await loadBookingScoped(bookingId, user);
  const payment = await Payment.findOne({ where: { booking_id: booking.id } });
  if (!payment) throw new NotFoundError('Payment not found');
  return payment;
}

/** GET /payments — admin list with filters, pagination & sorting (02 §8.9). */
export async function list(
  query: ListPaymentsQuery,
): Promise<{ rows: Payment[]; meta: PaginationMeta }> {
  const { limit, offset } = toOffsetLimit({ page: query.page, page_size: query.page_size });

  const where: WhereOptions = {};
  if (query.status) (where as Record<string, unknown>).status = query.status;
  if (query.method) (where as Record<string, unknown>).method = query.method;
  if (query.booking_id) (where as Record<string, unknown>).booking_id = query.booking_id;

  const order: Order = [[query.sort_by, query.sort_order.toUpperCase()]];

  const { rows, count } = await Payment.findAndCountAll({
    where,
    limit,
    offset,
    order,
  });

  return {
    rows,
    meta: buildPaginationMeta({ page: query.page, page_size: query.page_size }, count),
  };
}

/** GET /payments/:id — admin fetch a single payment by id. */
export async function getById(id: number): Promise<Payment> {
  const payment = await Payment.findByPk(id);
  if (!payment) throw new NotFoundError('Payment not found');
  return payment;
}
