import {
  BookingDTO,
  CategoryDTO,
  NotificationDTO,
  PaymentDTO,
  ProviderAvailabilityDTO,
  ProviderProfileDTO,
  ServiceDTO,
  UserDTO,
} from '../types/dto';
import {
  BookingStatus,
  DayOfWeek,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  RoleName,
} from '../types/enums';

/**
 * Model→DTO serializers (03 §18.7).
 *
 * Rules:
 *  - `password_hash` is NEVER included in any DTO.
 *  - DECIMAL columns are emitted as strings (e.g. "79.99", "4.80").
 *  - Date columns are emitted as ISO-8601 UTC strings.
 *
 * Inputs are typed loosely (`AnyModel`) because eager-loaded associations are
 * attached dynamically by Sequelize; each serializer reads only the fields it
 * needs and normalizes their representation.
 */
type AnyModel = Record<string, unknown>;

/**
 * Public serializer input: any Sequelize model instance OR a plain row. Typed
 * loosely as `object` because typed model classes (e.g. `Booking`) do not carry
 * a string index signature and are therefore not assignable to `AnyModel`. The
 * `plain()` helper narrows the value into an indexable `AnyModel`.
 */
type ModelInput = object;

/** Normalize a Sequelize model instance (or plain row) into a plain object. */
function plain(model: ModelInput): AnyModel {
  const obj: AnyModel =
    model && typeof (model as { get?: unknown }).get === 'function'
      ? (model as { get: (opts: { plain: boolean }) => AnyModel }).get({ plain: true })
      : (model as AnyModel);

  // Sequelize exposes managed timestamps as camelCase (createdAt/updatedAt) on a
  // freshly created/updated instance, while DTOs read snake_case. On DB reads the
  // query also selects the snake_case columns, but a just-written row returned by
  // create()/save() only carries the camelCase keys. Backfill snake_case from
  // camelCase when absent so serializing a write response never sees `undefined`.
  if (obj && typeof obj === 'object') {
    if (obj.created_at == null && obj.createdAt != null) obj.created_at = obj.createdAt;
    if (obj.updated_at == null && obj.updatedAt != null) obj.updated_at = obj.updatedAt;
  }
  return obj;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(value as string | number).toISOString();
}

function toIsoOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return toIso(value);
}

/** DECIMAL → string. Sequelize returns DECIMAL as string already; coerce defensively. */
function toDecimalString(value: unknown): string {
  if (value === null || value === undefined) return '0';
  return String(value);
}

function toNumber(value: unknown): number {
  return Number(value);
}

function toBool(value: unknown): boolean {
  return Boolean(value);
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

export function serializeUser(input: ModelInput): UserDTO {
  const u = plain(input);
  const roleAssoc = u.role as AnyModel | undefined;
  const role = (u.role_name ?? roleAssoc?.name) as RoleName;
  return {
    id: toNumber(u.id),
    role_id: toNumber(u.role_id),
    role,
    name: String(u.name),
    email: String(u.email),
    phone: toStringOrNull(u.phone),
    is_active: toBool(u.is_active),
    created_at: toIso(u.created_at),
    updated_at: toIso(u.updated_at),
  };
}

export function serializeProviderProfile(input: ModelInput): ProviderProfileDTO {
  const p = plain(input);
  return {
    id: toNumber(p.id),
    user_id: toNumber(p.user_id),
    bio: toStringOrNull(p.bio),
    skills: toStringOrNull(p.skills),
    service_area: toStringOrNull(p.service_area),
    rating: toDecimalString(p.rating),
    is_verified: toBool(p.is_verified),
    created_at: toIso(p.created_at),
    updated_at: toIso(p.updated_at),
  };
}

export function serializeCategory(input: ModelInput): CategoryDTO {
  const c = plain(input);
  return {
    id: toNumber(c.id),
    name: String(c.name),
    slug: String(c.slug),
    description: toStringOrNull(c.description),
    icon_url: toStringOrNull(c.icon_url),
    is_active: toBool(c.is_active),
    created_at: toIso(c.created_at),
    updated_at: toIso(c.updated_at),
  };
}

export function serializeService(input: ModelInput): ServiceDTO {
  const s = plain(input);
  const dto: ServiceDTO = {
    id: toNumber(s.id),
    category_id: toNumber(s.category_id),
    name: String(s.name),
    description: toStringOrNull(s.description),
    price: toDecimalString(s.price),
    currency: String(s.currency),
    duration_minutes:
      s.duration_minutes === null || s.duration_minutes === undefined
        ? null
        : toNumber(s.duration_minutes),
    image_url: toStringOrNull(s.image_url),
    is_active: toBool(s.is_active),
    created_at: toIso(s.created_at),
    updated_at: toIso(s.updated_at),
  };
  if (s.category) dto.category = serializeCategory(s.category as AnyModel);
  return dto;
}

export function serializeAvailability(input: ModelInput): ProviderAvailabilityDTO {
  const a = plain(input);
  return {
    id: toNumber(a.id),
    provider_id: toNumber(a.provider_id),
    day_of_week: a.day_of_week as DayOfWeek,
    start_time: String(a.start_time),
    end_time: String(a.end_time),
    is_available: toBool(a.is_available),
    created_at: toIso(a.created_at),
    updated_at: toIso(a.updated_at),
  };
}

export function serializePayment(input: ModelInput): PaymentDTO {
  const p = plain(input);
  return {
    id: toNumber(p.id),
    booking_id: toNumber(p.booking_id),
    amount: toDecimalString(p.amount),
    currency: String(p.currency),
    method: p.method as PaymentMethod,
    status: p.status as PaymentStatus,
    transaction_ref: toStringOrNull(p.transaction_ref),
    paid_at: toIsoOrNull(p.paid_at),
    created_at: toIso(p.created_at),
    updated_at: toIso(p.updated_at),
  };
}

export function serializeNotification(input: ModelInput): NotificationDTO {
  const n = plain(input);
  return {
    id: toNumber(n.id),
    user_id: toNumber(n.user_id),
    booking_id:
      n.booking_id === null || n.booking_id === undefined ? null : toNumber(n.booking_id),
    type: n.type as NotificationType,
    title: String(n.title),
    body: toStringOrNull(n.body),
    is_read: toBool(n.is_read),
    read_at: toIsoOrNull(n.read_at),
    created_at: toIso(n.created_at),
    updated_at: toIso(n.updated_at),
  };
}

export function serializeBooking(input: ModelInput): BookingDTO {
  const b = plain(input);
  const dto: BookingDTO = {
    id: toNumber(b.id),
    customer_id: toNumber(b.customer_id),
    provider_id:
      b.provider_id === null || b.provider_id === undefined ? null : toNumber(b.provider_id),
    service_id: toNumber(b.service_id),
    status: b.status as BookingStatus,
    scheduled_at: toIso(b.scheduled_at),
    total_price: toDecimalString(b.total_price),
    currency: String(b.currency),
    address: toStringOrNull(b.address),
    notes: toStringOrNull(b.notes),
    cancellation_reason: toStringOrNull(b.cancellation_reason),
    accepted_at: toIsoOrNull(b.accepted_at),
    started_at: toIsoOrNull(b.started_at),
    completed_at: toIsoOrNull(b.completed_at),
    cancelled_at: toIsoOrNull(b.cancelled_at),
    created_at: toIso(b.created_at),
    updated_at: toIso(b.updated_at),
  };
  if (b.service) dto.service = serializeService(b.service as AnyModel);
  if (b.customer) dto.customer = serializeUser(b.customer as AnyModel);
  if (b.provider) dto.provider = serializeUser(b.provider as AnyModel);
  else if (b.provider === null) dto.provider = null;
  if (b.payment) dto.payment = serializePayment(b.payment as AnyModel);
  else if (b.payment === null) dto.payment = null;
  return dto;
}
