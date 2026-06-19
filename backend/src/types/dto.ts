import {
  BookingStatus,
  DayOfWeek,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  RoleName,
} from './enums';

/** Per-field validation problem in an error envelope (02 §3.2). */
export interface FieldError {
  field: string;
  message: string;
}

/** Standard success envelope (02 §3.1). */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

/** Standard error envelope (02 §3.2). */
export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}

/** Pagination meta for list responses (02 §7.1). */
export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface UserDTO {
  id: number;
  role_id: number;
  role: RoleName;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResultDTO {
  access_token: string;
  token_type: 'Bearer';
  expires_in: string;
  user: UserDTO;
}

export interface ProviderProfileDTO {
  id: number;
  user_id: number;
  bio: string | null;
  skills: string | null;
  service_area: string | null;
  rating: string;
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
  category?: CategoryDTO;
  name: string;
  description: string | null;
  price: string;
  currency: string;
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
  start_time: string;
  end_time: string;
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
  scheduled_at: string;
  total_price: string;
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
  service?: ServiceDTO;
  customer?: UserDTO;
  provider?: UserDTO | null;
  payment?: PaymentDTO | null;
}

export interface PaymentDTO {
  id: number;
  booking_id: number;
  amount: string;
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
