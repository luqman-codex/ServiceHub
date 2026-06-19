// DTOs copied verbatim from 02-API-CONTRACT.md §6. Field names are snake_case to
// match the wire format exactly. Money DECIMAL fields are STRINGS; dates are
// ISO-8601 UTC strings.

export type RoleName = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type PaymentMethod = 'CARD' | 'CASH' | 'WALLET' | 'MOCK';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_REJECTED'
  | 'BOOKING_IN_PROGRESS'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT'
  | 'SYSTEM';

export interface UserDTO {
  id: number;
  role_id: number;
  role: RoleName; // resolved from roles.name (eager-loaded)
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string; // ISO-8601 UTC
  updated_at: string;
}

export interface AuthResultDTO {
  access_token: string;
  token_type: 'Bearer';
  expires_in: string; // mirrors JWT_EXPIRES_IN, e.g. "7d"
  user: UserDTO;
}

export interface ProviderProfileDTO {
  id: number;
  user_id: number;
  bio: string | null;
  skills: string | null; // CSV (see schema denorm note)
  service_area: string | null;
  rating: string; // DECIMAL(3,2) as string, e.g. "4.80"
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceDTO {
  id: number;
  category_id: number;
  category?: CategoryDTO; // present when ?include=category
  name: string;
  description: string | null;
  price: string; // DECIMAL(10,2) as string, e.g. "79.99"
  currency: string; // ISO 4217, e.g. "USD"
  duration_minutes: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProviderAvailabilityDTO {
  id: number;
  provider_id: number;
  day_of_week: DayOfWeek;
  start_time: string; // 'HH:mm:ss'
  end_time: string; // 'HH:mm:ss'
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingDTO {
  id: number;
  customer_id: number;
  provider_id: number | null;
  service_id: number;
  status: BookingStatus;
  scheduled_at: string; // ISO-8601 UTC
  total_price: string; // DECIMAL as string
  currency: string;
  address: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // optional eager-loaded relations (?include=service,customer,provider,payment)
  service?: ServiceDTO;
  customer?: UserDTO;
  provider?: UserDTO | null;
  payment?: PaymentDTO | null;
}

export interface PaymentDTO {
  id: number;
  booking_id: number;
  amount: string; // DECIMAL as string
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationDTO {
  id: number;
  user_id: number;
  booking_id: number | null;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Envelopes & pagination (02 §3, §7) ---

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number; // ceil(total_items / page_size)
  has_next: boolean;
  has_prev: boolean;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T; // resource object, array, or operation result
  meta?: PaginationMeta; // present only on paginated list responses (see §7)
}

export interface FieldError {
  field: string; // e.g. "email", "scheduled_at"
  message: string; // e.g. "must be a valid email"
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string; // stable machine-readable code (see §4.2)
    message: string; // human-readable summary
    details?: FieldError[]; // per-field validation problems (422 / 400)
  };
}

// Result shape returned by getPage() helper.
export interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}
