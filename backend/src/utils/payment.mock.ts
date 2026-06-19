import { randomUUID } from 'crypto';
import { PaymentMethod, PaymentStatus } from '../types/enums';

export interface MockChargeInput {
  amount: number;
  currency: string;
  method: PaymentMethod;
}

export interface MockChargeResult {
  status: PaymentStatus;
  transaction_ref: string;
  paid_at: Date | null;
}

/** Simulates a gateway: always "approves" unless method is intentionally failable. */
export function mockCharge(_input: MockChargeInput, forced?: PaymentStatus): MockChargeResult {
  const status = forced ?? PaymentStatus.PAID;
  return {
    status,
    transaction_ref: `MOCK-TXN-${randomUUID().slice(0, 12).toUpperCase()}`,
    paid_at: status === PaymentStatus.PAID ? new Date() : null,
  };
}
