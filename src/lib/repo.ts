import { db } from "./store";
import type { Booking, CategoryId, Payment, Review, VerificationRecord, WorkerProfile } from "./types";

export function getWorker(id: string) {
  return db().workers.find((w) => w.id === id) ?? null;
}
export function getHousehold(id: string) {
  return db().households.find((h) => h.id === id) ?? null;
}
export function getBooking(id: string) {
  return db().bookings.find((b) => b.id === id) ?? null;
}
export function getPaymentForBooking(bookingId: string): Payment | null {
  return db().payments.find((p) => p.bookingId === bookingId) ?? null;
}
export function verificationFor(workerId: string): VerificationRecord | null {
  return db().verifications.find((v) => v.workerId === workerId) ?? null;
}

export function workerReviews(workerId: string): Review[] {
  return db()
    .reviews.filter((r) => r.workerId === workerId && r.status === "published")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function householdBookings(householdId: string): Booking[] {
  return db()
    .bookings.filter((b) => b.householdId === householdId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function workerBookings(workerId: string): Booking[] {
  return db()
    .bookings.filter((b) => b.workerId === workerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function activeBookings(): Booking[] {
  return db().bookings.filter((b) => ["confirmed", "en-route", "arrived", "in-progress", "requested"].includes(b.status));
}

export function verificationQueue() {
  // The clock is read here, in the data layer, so the page component stays a
  // pure function of its inputs.
  const now = Date.now();
  const waitingDays = (iso?: string) => (iso ? Math.max(0, Math.round((now - Date.parse(iso)) / 86400000)) : 0);

  return db()
    .verifications.filter((v) => {
      const w = getWorker(v.workerId);
      return w && !w.verified;
    })
    .map((v) => ({ record: v, worker: getWorker(v.workerId)!, waitingDays: waitingDays(v.submittedAt) }))
    .sort((a, b) => (a.record.submittedAt ?? "").localeCompare(b.record.submittedAt ?? ""));
}

export function avgVerificationTurnaroundDays() {
  const done = db().verifications.filter((v) => v.submittedAt && v.decidedAt);
  if (!done.length) return 0;
  const total = done.reduce((sum, v) => sum + (Date.parse(v.decidedAt!) - Date.parse(v.submittedAt!)), 0);
  return Math.round((total / done.length / 86400000) * 10) / 10;
}

/**
 * A worker's rating is a running average over every rated job, not just the
 * reviews still on screen — so adding one review nudges it rather than
 * replacing years of history. Moderation reverses the same maths.
 */
export function applyRating(workerId: string, rating: number, direction: 1 | -1) {
  const w = getWorker(workerId);
  if (!w) return;
  const count = w.ratingCount;
  const total = w.rating * count + direction * rating;
  const newCount = count + direction;
  if (newCount <= 0) {
    w.rating = 0;
    w.ratingCount = 0;
    return;
  }
  w.ratingCount = newCount;
  w.rating = Math.round(Math.min(5, Math.max(0, total / newCount)) * 10) / 10;
}

export function workerEarnings(workerId: string) {
  const bookings = workerBookings(workerId).filter((b) => b.status === "completed");
  const rows = bookings
    .map((b) => {
      const pay = db().payments.find((p) => p.bookingId === b.id);
      return pay ? { booking: b, payment: pay } : null;
    })
    .filter(Boolean) as { booking: Booking; payment: Payment }[];

  const weekAgo = Date.now() - 7 * 86400000;
  const monthAgo = Date.now() - 30 * 86400000;
  const sum = (from: number) =>
    rows.filter((r) => Date.parse(r.payment.paidAt ?? r.booking.completedAt ?? "") >= from).reduce((s, r) => s + r.payment.workerPayout, 0);

  return {
    rows: rows.sort((a, b) => (b.payment.paidAt ?? "").localeCompare(a.payment.paidAt ?? "")),
    week: sum(weekAgo),
    month: sum(monthAgo),
    lifetime: rows.reduce((s, r) => s + r.payment.workerPayout, 0),
    pending: rows.filter((r) => r.payment.status === "paid").reduce((s, r) => s + r.payment.workerPayout, 0),
  };
}

export type DistrictStat = {
  district: string;
  demand: number;
  supply: number;
  verifiedWorkers: number;
  filled: number;
  fillRate: number;
  shortage: number;
};

export function districtRollup(period: string, trade: CategoryId | "all"): DistrictStat[] {
  const rows = db().stats.filter((s) => s.period === period && (trade === "all" || s.trade === trade));
  const byDistrict = new Map<string, DistrictStat>();
  for (const s of rows) {
    const cur =
      byDistrict.get(s.district) ??
      { district: s.district, demand: 0, supply: 0, verifiedWorkers: 0, filled: 0, fillRate: 0, shortage: 0 };
    cur.demand += s.demand;
    cur.supply += s.supply;
    cur.verifiedWorkers += s.verifiedWorkers;
    cur.filled += s.filled;
    byDistrict.set(s.district, cur);
  }
  return [...byDistrict.values()]
    .map((d) => ({
      ...d,
      fillRate: d.demand ? Math.round((d.filled / d.demand) * 100) : 0,
      shortage: Math.max(0, d.demand - d.supply),
    }))
    .sort((a, b) => b.demand - a.demand);
}

export function tradeRollup(period: string, district: string | "all") {
  const rows = db().stats.filter((s) => s.period === period && (district === "all" || s.district === district));
  const byTrade = new Map<CategoryId, { trade: CategoryId; demand: number; supply: number; verifiedWorkers: number; filled: number; avgWage: number; n: number; trainingDemandSignal: number }>();
  for (const s of rows) {
    const cur = byTrade.get(s.trade) ?? { trade: s.trade, demand: 0, supply: 0, verifiedWorkers: 0, filled: 0, avgWage: 0, n: 0, trainingDemandSignal: 0 };
    cur.demand += s.demand;
    cur.supply += s.supply;
    cur.verifiedWorkers += s.verifiedWorkers;
    cur.filled += s.filled;
    cur.avgWage += s.avgWage;
    cur.trainingDemandSignal += s.trainingDemandSignal;
    cur.n += 1;
    byTrade.set(s.trade, cur);
  }
  return [...byTrade.values()]
    .map((t) => ({
      ...t,
      avgWage: Math.round(t.avgWage / Math.max(1, t.n)),
      trainingDemandSignal: Math.round(t.trainingDemandSignal / Math.max(1, t.n)),
      fillRate: t.demand ? Math.round((t.filled / t.demand) * 100) : 0,
      shortage: Math.max(0, t.demand - t.supply),
    }))
    .sort((a, b) => b.shortage - a.shortage);
}

export function demandTrend(district: string | "all", trade: CategoryId | "all") {
  const periods = [...new Set(db().stats.map((s) => s.period))].sort();
  return periods.map((period) => {
    const rows = db().stats.filter(
      (s) => s.period === period && (district === "all" || s.district === district) && (trade === "all" || s.trade === trade),
    );
    return {
      period,
      demand: rows.reduce((s, r) => s + r.demand, 0),
      supply: rows.reduce((s, r) => s + r.supply, 0),
      filled: rows.reduce((s, r) => s + r.filled, 0),
    };
  });
}

export function activeWorkerCount(): number {
  return db().workers.filter((w: WorkerProfile) => w.verified && w.status === "active").length;
}
