'use client';

// src/app/(account)/bookings/[id]/page.tsx (04 §B.2.9 — C-8 detail, C-9 cancel, C-11 pay).
// GET /bookings/:id?include=service,provider,payment (own); POST /bookings/:id/cancel;
// POST/GET /bookings/:id/payment.
//
// Tracking: useBooking polls every 15s while the status is non-terminal + refetches on
// focus, so the StatusTimeline + badge stay near-live without websockets.
// Cancel (C-9): the button shows only when the client-side policy guard allows it
// (PENDING any time, or ACCEPTED while scheduled_at is in the future); the server is the
// source of truth and may still return 409 INVALID_STATUS_TRANSITION (→ toast).
// Pay (C-11): shown only when no payment exists; 409 PAYMENT_ALREADY_EXISTS disables it.
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, MapPin, StickyNote, User as UserIcon, XCircle } from 'lucide-react';
import { qk } from '@/lib/react-query/keys';
import { useBooking } from '@/lib/hooks/useBookings';
import {
  cancelBooking,
  getBookingPayment,
  type CancelBookingRequest,
} from '@/lib/api/payments';
import { useCreateBookingPayment } from '@/lib/hooks/useCreateBooking';
import { ApiError } from '@/lib/api/errors';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog } from '@/components/ui/Dialog';
import { LoadingState } from '@/components/data/LoadingState';
import { ErrorState } from '@/components/data/ErrorState';
import { EmptyState } from '@/components/data/EmptyState';
import { BookingStatusBadge } from '@/components/domain/BookingStatusBadge';
import { StatusTimeline } from '@/components/domain/StatusTimeline';
import { PaymentCard } from '@/components/domain/PaymentCard';
import { MoneyText } from '@/components/domain/MoneyText';
import { DateTimeText } from '@/components/domain/DateTimeText';
import type { BookingDTO, BookingStatus, PaymentDTO } from '@/types/api';

const TERMINAL_STATUSES: BookingStatus[] = ['REJECTED', 'COMPLETED', 'CANCELLED'];

function isTerminal(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// C-9 client-side guard mirroring the server policy window (02 §9.1).
function canCancel(booking: BookingDTO): boolean {
  if (booking.status === 'PENDING') return true;
  if (booking.status === 'ACCEPTED') {
    return new Date(booking.scheduled_at).getTime() > Date.now();
  }
  return false;
}

// GET /bookings/:id/payment — 404 => "No payment recorded" (empty state), so no retry on 404.
function useBookingPayment(id: number, enabled: boolean) {
  return useQuery<PaymentDTO, ApiError>({
    queryKey: qk.bookings.payment(id),
    queryFn: () => getBookingPayment(id),
    enabled: enabled && Number.isFinite(id),
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return failureCount < 2;
    },
  });
}

// POST /bookings/:id/cancel — invalidate ['bookings', id] + ['bookings'] (§B.2.9 success).
function useCancelBooking(id: number): UseMutationResult<
  BookingDTO,
  ApiError,
  CancelBookingRequest
> {
  const qc = useQueryClient();
  return useMutation<BookingDTO, ApiError, CancelBookingRequest>({
    mutationFn: (body) => cancelBooking(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(qk.bookings.detail(id), updated);
      void qc.invalidateQueries({ queryKey: qk.bookings.detail(id) });
      void qc.invalidateQueries({ queryKey: qk.bookings.all() });
    },
  });
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-sm text-slate-900">{children}</div>
      </div>
    </div>
  );
}

function CancelDialog({
  booking,
  open,
  onClose,
}: {
  booking: BookingDTO;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const cancel = useCancelBooking(booking.id);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    cancel.mutate(
      trimmed ? { cancellation_reason: trimmed } : {},
      {
        onSuccess: () => {
          toast.success('Booking cancelled');
          onClose();
          setReason('');
        },
        onError: (err) => {
          // 409 INVALID_STATUS_TRANSITION (outside window / terminal) → API message.
          toast.error(err.message);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Cancel this booking?"
      description="This cannot be undone. You may add an optional reason."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={cancel.isPending}>
            Keep booking
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={cancel.isPending}>
            Cancel booking
          </Button>
        </>
      }
    >
      <label htmlFor="cancel-reason" className="mb-1.5 block text-sm font-medium text-slate-700">
        Reason (optional)
      </label>
      <Textarea
        id="cancel-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={2000}
        placeholder="Let the provider know why you're cancelling…"
      />
    </Dialog>
  );
}

function PayPanel({ booking }: { booking: BookingDTO }) {
  const payment = useBookingPayment(booking.id, true);
  const createPayment = useCreateBookingPayment(booking.id);

  const isNotFound =
    payment.error instanceof ApiError && payment.error.status === 404;
  const hasPayment = Boolean(payment.data) && !isNotFound;
  // Eager-loaded payment relation also counts as existing.
  const paymentExists = hasPayment || Boolean(booking.payment);

  const handlePay = () => {
    createPayment.mutate(
      { method: 'MOCK', status: 'PAID' },
      {
        onSuccess: () => toast.success('Payment recorded'),
        onError: (err) => {
          // 409 PAYMENT_ALREADY_EXISTS → the pay action is no longer applicable.
          toast.error(err.message);
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <PaymentCard
        payment={payment.data ?? booking.payment ?? undefined}
        isLoading={payment.isLoading}
        isError={payment.isError}
        error={payment.error}
        onRetry={() => void payment.refetch()}
      />
      {!paymentExists && !payment.isLoading && (
        <Button
          fullWidth
          onClick={handlePay}
          isLoading={createPayment.isPending}
          leftIcon={<CreditCard className="h-4 w-4" />}
        >
          Pay&nbsp;
          <MoneyText amount={booking.total_price} currency={booking.currency} />
        </Button>
      )}
    </div>
  );
}

function BookingDetail({ id }: { id: number }) {
  const [cancelOpen, setCancelOpen] = useState(false);

  // C-8 tracking: useBooking refetches on window focus (QueryClient default) so the
  // StatusTimeline + badge stay near-live without websockets.
  const { data: booking, isLoading, isError, error, refetch } = useBooking(id, true);

  if (isLoading) {
    return <LoadingState variant="lines" rows={8} className="max-w-3xl" />;
  }

  if (isError || !booking) {
    // 403/404 (not own / missing) → "Not found".
    const notFound =
      error instanceof ApiError && (error.status === 404 || error.status === 403);
    if (notFound) {
      return (
        <EmptyState
          icon={XCircle}
          title="Booking not found"
          description="This booking does not exist or you do not have access to it."
          action={
            <Link href="/bookings">
              <Button variant="outline">Back to my bookings</Button>
            </Link>
          }
        />
      );
    }
    return <ErrorState error={error} onRetry={() => void refetch()} title="Unable to load booking" />;
  }

  const providerName = booking.provider?.name ?? null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          My bookings
        </Link>
        <BookingStatusBadge status={booking.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{booking.service?.name ?? `Service #${booking.service_id}`}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <DetailRow icon={CreditCard} label="Total">
            <span className="font-semibold">
              <MoneyText amount={booking.total_price} currency={booking.currency} />
            </span>
          </DetailRow>
          <DetailRow icon={UserIcon} label="Provider">
            {providerName ?? <span className="text-slate-500">Not assigned yet</span>}
          </DetailRow>
          <DetailRow icon={MapPin} label="Scheduled for">
            <DateTimeText value={booking.scheduled_at} format="datetime" />
          </DetailRow>
          {booking.address && (
            <DetailRow icon={MapPin} label="Address">
              {booking.address}
            </DetailRow>
          )}
          {booking.notes && (
            <DetailRow icon={StickyNote} label="Notes">
              {booking.notes}
            </DetailRow>
          )}
          {booking.cancellation_reason && (
            <DetailRow icon={XCircle} label="Cancellation reason">
              {booking.cancellation_reason}
            </DetailRow>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline booking={booking} />
        </CardContent>
      </Card>

      <PayPanel booking={booking} />

      {canCancel(booking) && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => setCancelOpen(true)}
            leftIcon={<XCircle className="h-4 w-4" />}
          >
            Cancel booking
          </Button>
        </div>
      )}

      <CancelDialog booking={booking} open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    return (
      <EmptyState
        icon={XCircle}
        title="Booking not found"
        description="The booking reference is invalid."
        action={
          <Link href="/bookings">
            <Button variant="outline">Back to my bookings</Button>
          </Link>
        }
      />
    );
  }

  return <BookingDetail id={id} />;
}
