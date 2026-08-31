import { db, nextId } from "./store";
import { applyRating, getBooking, getWorker, verificationFor } from "./repo";
import { paymentProvider, splitAmount } from "./integrations/payments";
import { identityProvider } from "./integrations/identity";
import { notifyProvider } from "./integrations/notify";
import { buildJobMessage } from "./messages";
import type { Booking, BookingStatus, BookingType, CategoryId, Payment, Review } from "./types";

/**
 * Booking lifecycle rules, kept free of request/session concerns so they can be
 * unit-tested and later moved behind an API layer unchanged. Server actions in
 * `actions.ts` are thin wrappers: auth, call one of these, revalidate.
 */

export type CreateBookingInput = {
  householdId: string;
  workerId: string;
  category: CategoryId;
  type: BookingType;
  date: string;
  time: string;
  days: number[];
  durationMins: number;
  price: number;
  notes?: string;
};

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const household = db().households.find((h) => h.id === input.householdId);
  const worker = getWorker(input.workerId);
  if (!household || !worker) throw new Error("Unknown household or worker");

  const booking: Booking = {
    id: nextId("bk"),
    householdId: household.id,
    workerId: worker.id,
    category: input.category,
    type: input.type,
    status: "requested",
    addressLine: household.addressLine,
    locality: household.locality,
    district: household.district,
    location: household.location,
    date: input.date,
    time: input.time,
    durationMins: input.durationMins,
    price: input.price,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    onPlatformPayment: true,
    schedule:
      input.type === "one-time"
        ? undefined
        : { days: input.days.length ? input.days : [1, 2, 3, 4, 5, 6], time: input.time, paused: false, startedAt: new Date().toISOString() },
  };
  db().bookings.push(booking);

  // The worker gets the full job card on WhatsApp, in their own language:
  // who called them, what work, when, where and how much.
  const message = buildJobMessage({ booking, worker, household });
  const sent = await notifyProvider.send({
    to: worker.phone,
    template: message.template,
    vars: message.vars,
    body: message.body,
  });
  booking.notifiedAt = sent.ok ? new Date().toISOString() : undefined;
  return booking;
}

export async function respondToBooking(bookingId: string, accept: boolean) {
  const b = getBooking(bookingId);
  if (!b) return null;
  const worker = getWorker(b.workerId ?? "");
  b.status = accept ? "confirmed" : "declined";
  if (!accept) b.workerId = null;

  const household = db().households.find((h) => h.id === b.householdId);
  if (household && worker) {
    await notifyProvider.send({
      to: household.phone,
      template: accept ? "booking_confirmed" : "booking_declined",
      vars: { worker: worker.name, date: b.date, time: b.time },
    });
  }
  return b;
}

export function advanceBooking(bookingId: string, status: BookingStatus) {
  const b = getBooking(bookingId);
  if (!b) return null;
  b.status = status;
  if (status === "completed") {
    b.completedAt = new Date().toISOString();
    const w = getWorker(b.workerId ?? "");
    if (w) w.jobsCompleted += 1;
  }
  return b;
}

export async function payBooking(bookingId: string, method: "upi" | "card" | "cash"): Promise<Payment | null> {
  const b = getBooking(bookingId);
  if (!b) return null;

  const order = await paymentProvider.createOrder({ bookingId, amount: b.price });
  const capture = await paymentProvider.capture({ orderId: order.orderId, method });
  const { platformFee, workerPayout } = splitAmount(b.price);

  const existing = db().payments.find((p) => p.bookingId === bookingId);
  const payment: Payment = {
    id: existing?.id ?? nextId("pay"),
    bookingId,
    amount: b.price,
    platformFee: method === "cash" ? 0 : platformFee,
    workerPayout: method === "cash" ? b.price : workerPayout,
    method,
    status: "paid",
    paidAt: capture.paidAt,
    payoutDueAt: paymentProvider.payoutDueAt(new Date()),
    reference: capture.reference,
  };
  if (existing) Object.assign(existing, payment);
  else db().payments.push(payment);

  b.paymentId = payment.id;
  b.onPlatformPayment = method !== "cash";
  return payment;
}

export function addReview(input: {
  bookingId: string;
  householdId: string;
  householdName: string;
  quality: number;
  punctuality: number;
  professionalism: number;
  text: string;
}): Review | null {
  const b = getBooking(input.bookingId);
  if (!b || !b.workerId) return null;

  const review: Review = {
    id: nextId("rv"),
    bookingId: b.id,
    workerId: b.workerId,
    householdId: input.householdId,
    householdName: input.householdName,
    quality: input.quality,
    punctuality: input.punctuality,
    professionalism: input.professionalism,
    rating: Math.round(((input.quality + input.punctuality + input.professionalism) / 3) * 10) / 10,
    text: input.text,
    verifiedJob: true,
    createdAt: new Date().toISOString(),
    status: "published",
  };
  db().reviews.push(review);
  b.reviewId = review.id;
  applyRating(b.workerId, review.rating, 1);
  return review;
}

export async function assignReplacement(bookingId: string) {
  const b = getBooking(bookingId);
  if (!b) return null;
  const current = getWorker(b.workerId ?? "");
  const replacement =
    db().workers.find((w) => w.verified && w.id !== b.workerId && w.categories.includes(b.category) && w.district === b.district) ??
    db().workers.find((w) => w.verified && w.id !== b.workerId && w.categories.includes(b.category));
  if (!replacement) return null;

  b.workerId = replacement.id;
  b.status = "confirmed";
  await notifyProvider.send({
    to: replacement.phone,
    template: "replacement_assigned",
    vars: { locality: b.locality, date: b.date, replacing: current?.name ?? "" },
  });
  return replacement;
}

export async function decideWorkerVerification(workerId: string, approve: boolean, note: string) {
  const rec = verificationFor(workerId);
  const worker = getWorker(workerId);
  if (!rec || !worker) return null;

  if (approve) {
    rec.govId.status = "complete";
    rec.policeCheck = { ...rec.policeCheck, status: "complete", clearedAt: new Date().toISOString() };
    rec.skillCheck = { ...rec.skillCheck, status: "complete", clearedAt: new Date().toISOString(), score: rec.skillCheck.score ?? 78 };
    if (rec.insurance.status !== "complete") {
      const pol = await identityProvider.enrolInsurance(workerId);
      rec.insurance = { status: "complete", policyNo: pol.policyNo, cover: pol.cover };
    }
    worker.verified = true;
    worker.status = "active";
  } else {
    rec.govId.status = "rejected";
    worker.verified = false;
    worker.status = "onboarding";
  }
  rec.reviewerNote = note;
  rec.decidedAt = new Date().toISOString();

  await notifyProvider.send({
    to: worker.phone,
    template: approve ? "verification_approved" : "verification_rejected",
    vars: { note },
  });
  return worker;
}
