/**
 * Payments provider boundary. Razorpay / Cashfree drop in behind this
 * interface: create an order, take the callback, release the worker payout.
 */
export type PaymentMethod = "upi" | "card" | "cash";

export interface PaymentProvider {
  name: string;
  createOrder(input: { bookingId: string; amount: number }): Promise<{ orderId: string; amount: number }>;
  capture(input: {
    orderId: string;
    method: PaymentMethod;
  }): Promise<{ ok: boolean; reference: string; paidAt: string }>;
  /** Worker payout is released on a fixed timeline after job completion. */
  payoutDueAt(completedAt: Date): string;
}

export const PLATFORM_FEE_RATE = 0.12;

export const mockPaymentProvider: PaymentProvider = {
  name: "mock-payments",
  async createOrder({ bookingId, amount }) {
    return { orderId: `order_${bookingId}_${Date.now().toString(36)}`, amount };
  },
  async capture({ orderId, method }) {
    console.info(`[mock-payments] captured ${orderId} via ${method}`);
    return {
      ok: true,
      reference: `TXN${Math.floor(100000 + Math.random() * 899999)}`,
      paidAt: new Date().toISOString(),
    };
  },
  payoutDueAt(completedAt) {
    const d = new Date(completedAt);
    d.setHours(d.getHours() + 24);
    return d.toISOString();
  },
};

export const paymentProvider: PaymentProvider = mockPaymentProvider;

export function splitAmount(amount: number) {
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE);
  return { platformFee, workerPayout: amount - platformFee };
}
