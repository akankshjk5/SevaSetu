"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LANG_COOKIE, SIMPLE_COOKIE, isLocale } from "@/i18n/config";
import { db, nextId, resetDb } from "./store";
import { clearSession, currentUser, setSession } from "./session";
import {
  AuthError,
  clampNumber,
  oneOf,
  requireAdmin,
  requireAssignedBooking,
  requireBookingParty,
  requireHousehold,
  requireOwnBooking,
  requireUser,
  requireWorker,
  text,
} from "./guard";
import { smsProvider } from "./integrations/sms";
import { identityProvider } from "./integrations/identity";
import { applyRating, getBooking, getPaymentForBooking, getWorker } from "./repo";
import {
  addReview,
  advanceBooking,
  assignReplacement,
  createBooking,
  decideWorkerVerification,
  payBooking,
  respondToBooking,
} from "./services";
import { ZONES } from "./seed";
import { CATEGORY_MAP } from "./categories";
import type { BookingStatus, BookingType, CategoryId, Role } from "./types";

const zoneFor = (name: string) => ZONES.find((z) => z.name === name) ?? ZONES[0];

const ZONE_NAMES = ZONES.map((z) => z.name) as [string, ...string[]];
const BOOKING_TYPES = ["one-time", "daily", "weekly", "recurring"] as const;
const BOOKING_STATUSES = [
  "requested",
  "confirmed",
  "en-route",
  "arrived",
  "in-progress",
  "completed",
  "cancelled",
  "declined",
] as const;
const PAYMENT_METHODS = ["upi", "card", "cash"] as const;
const VERIFICATION_STEPS = ["govId", "policeCheck", "skillCheck", "insurance"] as const;

/** A YYYY-MM-DD from the form, or today. */
function isoDate(value: FormDataEntryValue | null): string {
  const s = String(value ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : new Date().toISOString().slice(0, 10);
}

/** An HH:MM from the form, or the fallback. */
function clockTime(value: FormDataEntryValue | null, fallback: string): string {
  const s = String(value ?? "");
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s) ? s : fallback;
}

/** "1,2,3" from the form, filtered to real weekday indexes. */
function dayList(value: FormDataEntryValue | null): number[] {
  return [
    ...new Set(
      String(value ?? "")
        .split(",")
        .map(Number)
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
    ),
  ];
}

// ------------------------------------------------------------ language ----

/**
 * Stores the choice on the device (cookie) and, when signed in, on the user's
 * profile so it follows them to another device.
 */
export async function setLanguage(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  if (!isLocale(locale)) return;

  (await cookies()).set(LANG_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  const user = await currentUser();
  if (user) user.language = locale;

  const referer = (await headers()).get("referer");
  const back = referer ? new URL(referer).pathname + new URL(referer).search : "/";
  revalidatePath("/", "layout");
  redirect(back);
}

/**
 * Easy mode: bigger type, bigger targets, fewer words. Saved to the profile as
 * well as the cookie so a worker who sets it once keeps it on any device.
 */
export async function toggleSimpleMode(formData: FormData) {
  const on = String(formData.get("on")) === "1";
  (await cookies()).set(SIMPLE_COOKIE, on ? "1" : "0", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const user = await currentUser();
  if (user) user.simpleMode = on;

  const referer = (await headers()).get("referer");
  const back = referer ? new URL(referer).pathname + new URL(referer).search : "/";
  revalidatePath("/", "layout");
  redirect(back);
}

// ---------------------------------------------------------------- auth ----

export async function startLogin(formData: FormData) {
  const role = String(formData.get("role") ?? "household") as Role;
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  if (phone.length !== 10) redirect(`/login?role=${role}&error=${encodeURIComponent("Enter a 10-digit mobile number")}`);
  const res = await smsProvider.sendOtp(phone);
  redirect(`/login?role=${role}&phone=${phone}&sent=1&hint=${encodeURIComponent(res.hint)}`);
}

export async function completeLogin(formData: FormData) {
  const phone = String(formData.get("phone") ?? "");
  const code = String(formData.get("code") ?? "");
  const role = String(formData.get("role") ?? "household") as Role;
  const name = String(formData.get("name") ?? "").trim();
  const locality = String(formData.get("locality") || ZONES[0].name);
  const back = (msg: string, needsName = false) =>
    `/login?role=${role}&phone=${phone}&sent=1${needsName ? "&needsName=1" : ""}&error=${encodeURIComponent(msg)}`;

  const check = await smsProvider.verifyOtp(phone, code);
  if (!check.ok) redirect(back(check.reason ?? "Wrong code"));

  const data = db();
  let user = data.users.find((u) => u.phone === phone && u.role === role);

  if (!user) {
    if (!name) redirect(back("New number — tell us your name to finish signing up", true));
    const uid = nextId("u");
    user = { id: uid, role, name, phone, createdAt: new Date().toISOString() };
    data.users.push(user);
    const z = zoneFor(locality);

    if (role === "household") {
      data.households.push({
        id: nextId("h"),
        userId: uid,
        name,
        phone,
        addressLine: `${locality}, Jaipur`,
        locality,
        district: locality,
        location: { lat: z.lat, lng: z.lng },
        savedLocations: [{ label: "Home", addressLine: `${locality}, Jaipur`, location: { lat: z.lat, lng: z.lng } }],
      });
    } else if (role === "worker") {
      const wid = nextId("w");
      data.workers.push({
        id: wid,
        userId: uid,
        name,
        photo: "",
        phone,
        locality,
        district: locality,
        location: { lat: z.lat, lng: z.lng },
        categories: [],
        experienceYears: 0,
        languages: ["Hindi"],
        wage: 0,
        bio: "",
        rating: 0,
        ratingCount: 0,
        jobsCompleted: 0,
        availableDays: [1, 2, 3, 4, 5, 6],
        availableFrom: "08:00",
        availableTo: "18:00",
        verified: false,
        status: "onboarding",
        joinedAt: new Date().toISOString(),
      });
      data.verifications.push({
        workerId: wid,
        govId: { status: "not-started" },
        policeCheck: { status: "not-started" },
        skillCheck: { status: "not-started" },
        insurance: { status: "not-started" },
      });
    }
  }

  await setSession({ userId: user.id, role });
  const next = String(formData.get("next") ?? "");
  if (next.startsWith("/")) redirect(next);
  redirect(role === "household" ? "/household" : role === "worker" ? "/worker/profile" : role === "admin" ? "/admin" : "/gov");
}

export async function demoLogin(formData: FormData) {
  const role = String(formData.get("role")) as Role;
  const userId = String(formData.get("userId") ?? "");
  const data = db();
  const user = userId ? data.users.find((u) => u.id === userId) : data.users.find((u) => u.role === role);
  if (!user) return;
  await setSession({ userId: user.id, role: user.role });
  redirect(user.role === "household" ? "/household" : user.role === "worker" ? "/worker" : user.role === "admin" ? "/admin" : "/gov");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function resetDemoData() {
  // Wipes every booking, payment and review in the demo — signed-in users only.
  await requireUser();
  resetDb();
  await clearSession();
  redirect("/");
}

// ----------------------------------------------------------- household ----

export async function bookWorker(formData: FormData) {
  const household = await requireHousehold();

  const worker = getWorker(text(formData.get("workerId"), 60));
  if (!worker) redirect("/household/post");
  // Only a verified worker can be booked — the badge is the whole promise, and
  // the check belongs here rather than only on the button that renders it.
  if (!worker.verified) throw new AuthError("Worker is not verified");

  const category = oneOf(formData.get("category"), worker.categories, worker.categories[0]);
  const type = oneOf(formData.get("type"), BOOKING_TYPES, "one-time");

  const booking = await createBooking({
    householdId: household.id,
    workerId: worker.id,
    category,
    type,
    date: isoDate(formData.get("date")),
    time: clockTime(formData.get("time"), worker.availableFrom),
    days: dayList(formData.get("days")),
    durationMins: clampNumber(formData.get("durationMins"), 15, 600, 90),
    // The price is the worker's advertised wage, read from the worker record.
    // Taking it from the form let a booking be created at any amount.
    price: worker.wage,
    notes: text(formData.get("notes"), 400),
  });

  revalidatePath("/household");
  revalidatePath("/worker");
  redirect(`/household/bookings/${booking.id}`);
}

export async function setBookingStatus(formData: FormData) {
  const bookingId = text(formData.get("bookingId"), 60);
  await requireBookingParty(bookingId);
  advanceBooking(bookingId, oneOf(formData.get("status"), BOOKING_STATUSES, "confirmed"));
  revalidatePath("/household");
  revalidatePath("/worker");
  revalidatePath("/admin");
  revalidatePath(`/household/bookings/${bookingId}`);
  revalidatePath(`/worker/jobs/${bookingId}`);
}

export async function payForBooking(formData: FormData) {
  const bookingId = text(formData.get("bookingId"), 60);
  const { booking } = await requireOwnBooking(bookingId);

  // Pay once, and only for work that is done.
  if (booking.status !== "completed") throw new AuthError("Booking is not completed yet");
  const existing = getPaymentForBooking(bookingId);
  if (existing && existing.status !== "pending") redirect(`/household/bookings/${bookingId}?paid=1`);

  await payBooking(bookingId, oneOf(formData.get("method"), PAYMENT_METHODS, "upi"));
  revalidatePath(`/household/bookings/${bookingId}`);
  revalidatePath("/worker/earnings");
  redirect(`/household/bookings/${bookingId}?paid=1`);
}

export async function submitReview(formData: FormData) {
  const bookingId = text(formData.get("bookingId"), 60);
  const { household, booking } = await requireOwnBooking(bookingId);

  // You can only review work that happened, and only once — otherwise a
  // household could drive a worker's rating up or down at will.
  if (booking.status !== "completed") throw new AuthError("Booking is not completed yet");
  if (booking.reviewId) redirect(`/household/bookings/${bookingId}?reviewed=1`);

  addReview({
    bookingId,
    householdId: household.id,
    householdName: household.name,
    quality: clampNumber(formData.get("quality"), 1, 5, 5),
    punctuality: clampNumber(formData.get("punctuality"), 1, 5, 5),
    professionalism: clampNumber(formData.get("professionalism"), 1, 5, 5),
    text: text(formData.get("text"), 600),
  });

  revalidatePath(`/household/bookings/${bookingId}`);
  revalidatePath(`/household/workers/${booking.workerId}`);
  redirect(`/household/bookings/${bookingId}?reviewed=1`);
}

export async function togglePause(formData: FormData) {
  const { booking } = await requireOwnBooking(text(formData.get("bookingId"), 60));
  if (!booking.schedule) return;
  booking.schedule.paused = !booking.schedule.paused;
  revalidatePath("/household/team");
  revalidatePath(`/household/bookings/${booking.id}`);
}

export async function cancelBooking(formData: FormData) {
  const { booking } = await requireOwnBooking(text(formData.get("bookingId"), 60));
  if (booking.status === "completed") throw new AuthError("Completed work cannot be cancelled");
  booking.status = "cancelled";
  revalidatePath("/household");
  revalidatePath(`/household/bookings/${booking.id}`);
}

export async function requestReplacement(formData: FormData) {
  const bookingId = text(formData.get("bookingId"), 60);
  await requireOwnBooking(bookingId);
  await assignReplacement(bookingId);
  revalidatePath(`/household/bookings/${bookingId}`);
  revalidatePath("/household/team");
}

export async function raiseDispute(formData: FormData) {
  const bookingId = text(formData.get("bookingId"), 60);
  // Either side of the booking may raise one, but only about their own job.
  const booking = await requireBookingParty(bookingId);
  const user = await requireUser();

  db().disputes.push({
    id: nextId("dp"),
    bookingId: booking.id,
    raisedBy: user.role === "worker" ? "worker" : "household",
    raisedByName: user.name,
    reason: text(formData.get("reason"), 120) || "Other",
    detail: text(formData.get("detail"), 800),
    status: "open",
    notes: [],
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/admin/disputes");
  revalidatePath(`/household/bookings/${bookingId}`);
}

// -------------------------------------------------------------- worker ----

export async function saveWorkerProfile(formData: FormData) {
  const worker = await requireWorker();

  // Only real trades, and only ones this build offers.
  const categories = formData
    .getAll("categories")
    .map(String)
    .filter((c): c is CategoryId => c in CATEGORY_MAP);
  const locality = oneOf(formData.get("locality"), ZONE_NAMES, worker.locality as (typeof ZONE_NAMES)[number]);
  const z = zoneFor(locality);

  Object.assign(worker, {
    name: text(formData.get("name"), 80) || worker.name,
    locality,
    district: locality,
    location: { lat: z.lat, lng: z.lng },
    categories: categories.length ? categories : worker.categories,
    experienceYears: clampNumber(formData.get("experienceYears"), 0, 60, worker.experienceYears),
    languages: text(formData.get("languages"), 200)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8) || worker.languages,
    // A wage of zero or a negative number would break payouts and ranking.
    wage: clampNumber(formData.get("wage"), 1, 200000, worker.wage),
    bio: text(formData.get("bio"), 600),
  });

  revalidatePath("/worker");
  redirect("/worker/verification");
}

export async function saveAvailability(formData: FormData) {
  const worker = await requireWorker();
  const days = [...new Set(formData.getAll("days").map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  worker.availableDays = days;
  worker.availableFrom = clockTime(formData.get("from"), worker.availableFrom);
  worker.availableTo = clockTime(formData.get("to"), worker.availableTo);
  revalidatePath("/worker/availability");
  redirect("/worker/availability?saved=1");
}

export async function submitVerificationStep(formData: FormData) {
  const worker = await requireWorker();
  const rec = db().verifications.find((v) => v.workerId === worker.id);
  if (!rec) return;
  const step = oneOf(formData.get("step"), VERIFICATION_STEPS, "govId");
  const docType = text(formData.get("docType"), 40) || "Aadhaar";

  if (step === "govId") {
    const res = await identityProvider.submitId({
      workerId: worker.id,
      docType,
      docNumber: text(formData.get("docNumber"), 40) || "0000",
    });
    rec.govId = {
      status: "pending",
      docType,
      docNumberMasked: res.docNumberMasked,
      submittedAt: new Date().toISOString(),
    };
    rec.submittedAt = rec.submittedAt ?? new Date().toISOString();
  }
  if (step === "policeCheck") {
    await identityProvider.requestPoliceCheck(worker.id);
    rec.policeCheck = { status: "pending", submittedAt: new Date().toISOString() };
  }
  if (step === "skillCheck") {
    const slot = await identityProvider.scheduleSkillCheck({ workerId: worker.id, trade: worker.categories[0] ?? "cleaner" });
    rec.skillCheck = { status: "pending", assessor: slot.centre };
  }
  if (step === "insurance") {
    const pol = await identityProvider.enrolInsurance(worker.id);
    rec.insurance = { status: "complete", policyNo: pol.policyNo, cover: pol.cover };
  }

  revalidatePath("/worker/verification");
  revalidatePath("/admin/verification");
}

export async function respondToJob(formData: FormData) {
  const bookingId = text(formData.get("bookingId"), 60);
  // Only the worker the job was offered to may answer it.
  const { booking } = await requireAssignedBooking(bookingId);
  if (booking.status !== "requested") throw new AuthError("This job has already been answered");

  await respondToBooking(bookingId, String(formData.get("accept")) === "yes");
  revalidatePath("/worker");
  revalidatePath("/household");
  redirect("/worker/jobs");
}

// --------------------------------------------------------------- admin ----

export async function decideVerification(formData: FormData) {
  // Approving a worker makes them bookable and insured. Ops only.
  await requireAdmin();
  await decideWorkerVerification(
    text(formData.get("workerId"), 60),
    String(formData.get("decision")) === "approve",
    text(formData.get("note"), 400),
  );
  revalidatePath("/admin/verification");
  revalidatePath("/worker/verification");
}

export async function resolveDispute(formData: FormData) {
  const user = await requireAdmin();
  const d = db().disputes.find((x) => x.id === text(formData.get("disputeId"), 60));
  if (!d) return;
  const resolution = text(formData.get("resolution"), 600);
  d.notes.push({ at: new Date().toISOString(), by: user.name, text: resolution });
  d.status = "resolved";
  d.resolution = resolution;
  d.resolvedAt = new Date().toISOString();
  revalidatePath("/admin/disputes");
}

export async function addDisputeNote(formData: FormData) {
  const user = await requireAdmin();
  const d = db().disputes.find((x) => x.id === text(formData.get("disputeId"), 60));
  if (!d) return;
  d.notes.push({ at: new Date().toISOString(), by: user.name, text: text(formData.get("note"), 600) });
  revalidatePath("/admin/disputes");
}

export async function moderateReview(formData: FormData) {
  await requireAdmin();
  const review = db().reviews.find((r) => r.id === text(formData.get("reviewId"), 60));
  if (!review) return;
  const action = String(formData.get("action"));
  const wasCounted = review.status !== "removed";
  const nowCounted = action !== "remove";
  review.status = nowCounted ? "published" : "removed";
  review.moderationNote = String(formData.get("note") ?? "");
  if (wasCounted !== nowCounted) applyRating(review.workerId, review.rating, nowCounted ? 1 : -1);
  revalidatePath("/admin/reviews");
}
