import { Op, Order, WhereOptions } from 'sequelize';
import { sequelize, Booking, Service, User, Role, Payment } from '../models';
import {
  BookingStatus,
  RoleName,
  NotificationType,
  BOOKING_TRANSITIONS,
} from '../types/enums';
import { AuthUser } from '../types/jwt';
import {
  NotFoundError,
  ForbiddenError,
  InvalidStatusTransitionError,
  ValidationError,
} from '../utils/errors';
import { dispatchNotification } from '../utils/notification.mock';
import { buildPaginationMeta, toOffsetLimit } from '../utils/pagination';

const TERMINAL = new Set<BookingStatus>([
  BookingStatus.REJECTED,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
]);

interface CreateBookingInput {
  service_id: number;
  scheduled_at: string;
  address?: string | null;
  notes?: string | null;
  provider_id?: number | null;
  customer_id?: number;
}

// ── CREATE (T1: → PENDING, with price snapshot + BOOKING_CREATED notification) ──
export async function create(input: CreateBookingInput, user: AuthUser): Promise<Booking> {
  const isAdmin = user.role === RoleName.ADMIN;

  // service must exist AND be active (02 §8.6 validation)
  const service = await Service.findByPk(input.service_id);
  if (!service || !service.is_active) throw new NotFoundError('Service not found');

  // CUSTOMER books for self; ADMIN may target another customer / pre-assign a provider
  const customerId = isAdmin && input.customer_id ? input.customer_id : user.id;
  const providerId = isAdmin ? (input.provider_id ?? null) : null;

  if (isAdmin && providerId) await assertUserHasRole(providerId, RoleName.PROVIDER); // 01 §10.6
  if (isAdmin && input.customer_id) await assertUserHasRole(customerId, RoleName.CUSTOMER);

  return sequelize.transaction(async (tx) => {
    const booking = await Booking.create(
      {
        customer_id: customerId,
        provider_id: providerId,
        service_id: service.id,
        status: BookingStatus.PENDING,
        scheduled_at: new Date(input.scheduled_at),
        total_price: service.price, // ← price snapshot (01 §2.7)
        currency: service.currency, // ← currency snapshot
        address: input.address ?? null,
        notes: input.notes ?? null,
      },
      { transaction: tx },
    );
    await dispatchNotification(
      {
        user_id: customerId,
        booking_id: booking.id,
        type: NotificationType.BOOKING_CREATED,
        title: 'Booking placed',
        body: 'Your booking request is pending.',
      },
      tx,
    );
    return booking;
  });
}

// ── TRANSITION (T2–T8): the single state-machine entry point ──
export async function transition(
  id: number,
  target: BookingStatus,
  user: AuthUser,
  cancellationReason?: string,
): Promise<Booking> {
  return sequelize.transaction(async (tx) => {
    const booking = await Booking.findByPk(id, { transaction: tx, lock: tx.LOCK.UPDATE });
    if (!booking) throw new NotFoundError('Booking not found');

    // 1) adjacency guard (01 §5.3) — illegal/terminal → 409
    const legal = BOOKING_TRANSITIONS[booking.status as BookingStatus] ?? [];
    if (!legal.includes(target)) {
      throw new InvalidStatusTransitionError(
        `Cannot move a booking from ${booking.status} to ${target}`,
      );
    }

    // 2) role + ownership per target (02 §5, §9)
    assertTransitionAllowed(booking, target, user);

    // 3) reason length guard (02 §9.2)
    if (cancellationReason && cancellationReason.length > 2000) {
      throw new ValidationError([
        { field: 'cancellation_reason', message: 'must be ≤2000 chars' },
      ]);
    }

    applyTransition(booking, target, user, cancellationReason);
    await booking.save({ transaction: tx });

    // mocked notification for the transition (§15) — customer (+ provider on cancel)
    await dispatchNotification(
      {
        user_id: booking.customer_id,
        booking_id: booking.id,
        type: NOTIF_FOR[target],
        title: titleFor(target),
        body: bodyFor(target),
      },
      tx,
    );
    if (target === BookingStatus.CANCELLED && booking.provider_id) {
      await dispatchNotification(
        {
          user_id: booking.provider_id,
          booking_id: booking.id,
          type: NotificationType.BOOKING_CANCELLED,
          title: titleFor(target),
          body: bodyFor(target),
        },
        tx,
      );
    }
    return booking;
  });
}

// ── PATCH /bookings/:id/status (row 37) — admin generic transition (02 §9.2) ──
export async function adminSetStatus(
  id: number,
  target: BookingStatus,
  user: AuthUser,
  cancellationReason?: string,
): Promise<Booking> {
  if (
    (target === BookingStatus.REJECTED || target === BookingStatus.CANCELLED) &&
    !cancellationReason
  ) {
    throw new ValidationError([
      {
        field: 'cancellation_reason',
        message: 'cancellation_reason is required when status is REJECTED or CANCELLED',
      },
    ]);
  }
  // ADMIN is allowed any legal transition; transition() enforces adjacency + sets timestamps/notifs.
  return transition(id, target, user, cancellationReason);
}

// ── PATCH /bookings/:id/assign (row 38) — admin set/reassign provider (02 §9.3) ──
export async function assignProvider(
  id: number,
  providerId: number | null,
  _user: AuthUser,
): Promise<Booking> {
  if (providerId !== null) await assertUserHasRole(providerId, RoleName.PROVIDER); // 01 §10.6

  return sequelize.transaction(async (tx) => {
    const booking = await Booking.findByPk(id, { transaction: tx, lock: tx.LOCK.UPDATE });
    if (!booking) throw new NotFoundError('Booking not found');

    // booking must not be in a terminal state (02 §9.3)
    if (TERMINAL.has(booking.status)) {
      throw new InvalidStatusTransitionError(
        `Cannot assign a provider to a booking in status ${booking.status}`,
      );
    }

    booking.provider_id = providerId;
    await booking.save({ transaction: tx });
    return booking;
  });
}

// ── PATCH /bookings/:id (row 31) — edit mutable details ──
export async function updateDetails(
  id: number,
  input: { scheduled_at?: string; address?: string | null; notes?: string | null },
  user: AuthUser,
): Promise<Booking> {
  return sequelize.transaction(async (tx) => {
    const booking = await Booking.findByPk(id, { transaction: tx, lock: tx.LOCK.UPDATE });
    if (!booking) throw new NotFoundError('Booking not found');

    if (user.role === RoleName.CUSTOMER) {
      if (booking.customer_id !== user.id) {
        throw new ForbiddenError('You do not have access to this booking');
      }
      // CUSTOMER may edit only while PENDING (02 §8.6)
      if (booking.status !== BookingStatus.PENDING) {
        throw new InvalidStatusTransitionError(
          `Cannot edit a booking in status ${booking.status}`,
        );
      }
    } else if (user.role === RoleName.ADMIN) {
      // ADMIN may edit any non-terminal booking (02 §8.6)
      if (TERMINAL.has(booking.status)) {
        throw new InvalidStatusTransitionError(
          `Cannot edit a booking in status ${booking.status}`,
        );
      }
    } else {
      throw new ForbiddenError('You do not have access to this booking');
    }

    if (input.scheduled_at !== undefined) booking.scheduled_at = new Date(input.scheduled_at);
    if (input.address !== undefined) booking.address = input.address ?? null;
    if (input.notes !== undefined) booking.notes = input.notes ?? null;

    await booking.save({ transaction: tx });
    return booking;
  });
}

// ── role/ownership guard per transition (02 §5 matrix + §9) ──
function assertTransitionAllowed(b: Booking, target: BookingStatus, user: AuthUser): void {
  if (user.role === RoleName.ADMIN) return; // ADMIN: any legal transition (incl. IN_PROGRESS→CANCELLED, T8)

  if (user.role === RoleName.PROVIDER) {
    const ownsOrOpen =
      b.provider_id === user.id ||
      (b.provider_id == null && b.status === BookingStatus.PENDING);
    if (target === BookingStatus.ACCEPTED || target === BookingStatus.REJECTED) {
      if (!ownsOrOpen) throw new ForbiddenError('Not your job');
    } else if (target === BookingStatus.IN_PROGRESS || target === BookingStatus.COMPLETED) {
      if (b.provider_id !== user.id) throw new ForbiddenError('Not your job');
    } else {
      throw new ForbiddenError('Provider cannot perform this transition');
    }
    return;
  }

  // CUSTOMER: cancel own only; ACCEPTED→CANCELLED only inside the policy window (02 §9.1)
  if (user.role === RoleName.CUSTOMER) {
    if (target !== BookingStatus.CANCELLED || b.customer_id !== user.id) {
      throw new ForbiddenError('Not allowed');
    }
    if (b.status === BookingStatus.ACCEPTED && b.scheduled_at.getTime() <= Date.now()) {
      throw new InvalidStatusTransitionError('Cancellation window has closed');
    }
  }
}

// ── apply side effects + timestamps (01 §5.2) ──
function applyTransition(
  booking: Booking,
  target: BookingStatus,
  user: AuthUser,
  cancellationReason?: string,
): void {
  const now = new Date();
  booking.status = target;
  switch (target) {
    case BookingStatus.ACCEPTED:
      booking.accepted_at = now;
      // self-claim an open job
      if (!booking.provider_id && user.role === RoleName.PROVIDER) {
        booking.provider_id = user.id;
      }
      break;
    case BookingStatus.IN_PROGRESS:
      booking.started_at = now;
      break;
    case BookingStatus.COMPLETED:
      booking.completed_at = now;
      break;
    case BookingStatus.REJECTED:
    case BookingStatus.CANCELLED:
      booking.cancelled_at = now;
      booking.cancellation_reason = cancellationReason ?? booking.cancellation_reason ?? null;
      break;
    default:
      break;
  }
}

async function assertUserHasRole(userId: number, role: RoleName): Promise<void> {
  const u = await User.findByPk(userId, { include: [{ model: Role, as: 'role' }] });
  const name = (u as unknown as { role?: { name: RoleName } } | null)?.role?.name;
  if (!u || name !== role) {
    throw new ValidationError([{ field: 'user', message: `referenced user must be a ${role}` }]);
  }
}

const NOTIF_FOR: Record<BookingStatus, NotificationType> = {
  [BookingStatus.PENDING]: NotificationType.BOOKING_CREATED,
  [BookingStatus.ACCEPTED]: NotificationType.BOOKING_ACCEPTED,
  [BookingStatus.REJECTED]: NotificationType.BOOKING_REJECTED,
  [BookingStatus.IN_PROGRESS]: NotificationType.BOOKING_IN_PROGRESS,
  [BookingStatus.COMPLETED]: NotificationType.BOOKING_COMPLETED,
  [BookingStatus.CANCELLED]: NotificationType.BOOKING_CANCELLED,
};
const titleFor = (s: BookingStatus): string => `Booking ${s.toLowerCase().replace('_', ' ')}`;
const bodyFor = (s: BookingStatus): string => `Your booking is now ${s}.`;

// ── role-scoped LIST (02 §8.6) ──
export async function list(
  query: Record<string, unknown>,
  user: AuthUser,
): Promise<{ rows: Booking[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const page = Number(query.page ?? 1);
  const page_size = Number(query.page_size ?? 20);
  const { limit, offset } = toOffsetLimit({ page, page_size });

  const where: WhereOptions = {};
  const and: WhereOptions[] = [];

  if (user.role === RoleName.CUSTOMER) {
    and.push({ customer_id: user.id }); // own only
  } else if (user.role === RoleName.PROVIDER) {
    const scope = (query.scope as string) ?? 'assigned';
    if (scope === 'available') {
      and.push({ provider_id: null, status: BookingStatus.PENDING });
    } else if (scope === 'all') {
      and.push({
        [Op.or]: [
          { provider_id: user.id },
          { provider_id: null, status: BookingStatus.PENDING },
        ],
      } as WhereOptions);
    } else {
      and.push({ provider_id: user.id }); // assigned (default)
    }
  }
  // ADMIN: no role scope filter; may use customer_id/provider_id query filters

  if (query.status) and.push({ status: query.status as BookingStatus });
  if (query.service_id) and.push({ service_id: Number(query.service_id) });
  if (user.role === RoleName.ADMIN && query.customer_id) {
    and.push({ customer_id: Number(query.customer_id) });
  }
  if (user.role === RoleName.ADMIN && query.provider_id) {
    and.push({ provider_id: Number(query.provider_id) });
  }

  const scheduledRange: Record<symbol, Date> = {};
  if (query.scheduled_from) scheduledRange[Op.gte] = new Date(query.scheduled_from as string);
  if (query.scheduled_to) scheduledRange[Op.lte] = new Date(query.scheduled_to as string);
  if (Object.getOwnPropertySymbols(scheduledRange).length) {
    and.push({ scheduled_at: scheduledRange } as WhereOptions);
  }

  if (and.length) (where as Record<symbol, unknown>)[Op.and] = and;

  const sortBy = (query.sort_by as string) ?? 'scheduled_at';
  const sortOrder = ((query.sort_order as string) ?? 'desc').toUpperCase();
  const order: Order = [[sortBy, sortOrder]];

  const { rows, count } = await Booking.findAndCountAll({
    where,
    limit,
    offset,
    order,
    include: buildInclude(String(query.include ?? '')),
    distinct: true,
  });
  return { rows, meta: buildPaginationMeta({ page, page_size }, count) };
}

// ── scoped single read (404 vs 403 rule, 02 §2.4) ──
export async function getByIdScoped(
  id: number,
  user: AuthUser,
  include: string,
): Promise<Booking> {
  const booking = await Booking.findByPk(id, { include: buildInclude(include) });
  if (!booking) throw new NotFoundError('Booking not found');
  if (user.role === RoleName.ADMIN) return booking;
  if (user.role === RoleName.CUSTOMER && booking.customer_id === user.id) return booking;
  if (
    user.role === RoleName.PROVIDER &&
    (booking.provider_id === user.id ||
      (booking.provider_id == null && booking.status === BookingStatus.PENDING))
  ) {
    return booking;
  }
  throw new ForbiddenError('You do not have access to this booking');
}

function buildInclude(include: string): object[] {
  const want = new Set(
    include
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const inc: object[] = [];
  if (want.has('service')) inc.push({ model: Service, as: 'service' });
  if (want.has('customer')) {
    inc.push({ model: User, as: 'customer', include: [{ model: Role, as: 'role' }] });
  }
  if (want.has('provider')) {
    inc.push({ model: User, as: 'provider', include: [{ model: Role, as: 'role' }] });
  }
  if (want.has('payment')) inc.push({ model: Payment, as: 'payment' });
  return inc;
}
