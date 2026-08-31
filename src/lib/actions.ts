"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LANG_COOKIE, SIMPLE_COOKIE, isLocale } from "@/i18n/config";
import { db, nextId, resetDb } from "./store";
import { clearSession, currentHousehold, currentUser, currentWorker, setSession } from "./session";
import { smsProvider } from "./integrations/sms";
import { identityProvider } from "./integrations/identity";
import { applyRating, getBooking, getWorker } from "./repo";
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
import type { BookingStatus, BookingType, CategoryId, Role } from "./types";

const zoneFor = (name: string) => ZONES.find((z) => z.name === name) ?? ZONES[0];

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
  resetDb();
  await clearSession();
  redirect("/");
}

// ----------------------------------------------------------- household ----

export async function bookWorker(formData: FormData) {
  const household = await currentHousehold();
  if (!household) redirect("/login?role=household");

  const workerId = String(formData.get("workerId"));
  const worker = getWorker(workerId);
  if (!worker) redirect("/household/post");

  const booking = await createBooking({
    householdId: household.id,
    workerId,
    category: String(formData.get("category")) as CategoryId,
    type: String(formData.get("type") ?? "one-time") as BookingType,
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    time: String(formData.get("time") || worker.availableFrom),
    days: String(formData.get("days") ?? "").split(",").filter(Boolean).map(Number),
    durationMins: Number(formData.get("durationMins") ?? 90),
    price: Number(formData.get("price") ?? worker.wage),
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/household");
  revalidatePath("/worker");
  redirect(`/household/bookings/${booking.id}`);
}

export async function setBookingStatus(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  advanceBooking(bookingId, String(formData.get("status")) as BookingStatus);
  revalidatePath("/household");
  revalidatePath("/worker");
  revalidatePath("/admin");
  revalidatePath(`/household/bookings/${bookingId}`);
  revalidatePath(`/worker/jobs/${bookingId}`);
}

export async function payForBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  await payBooking(bookingId, String(formData.get("method") ?? "upi") as "upi" | "card" | "cash");
  revalidatePath(`/household/bookings/${bookingId}`);
  revalidatePath("/worker/earnings");
  redirect(`/household/bookings/${bookingId}?paid=1`);
}

export async function submitReview(formData: FormData) {
  const household = await currentHousehold();
  const bookingId = String(formData.get("bookingId"));
  const booking = getBooking(bookingId);
  if (!household || !booking) return;

  addReview({
    bookingId,
    householdId: household.id,
    householdName: household.name,
    quality: Number(formData.get("quality") ?? 5),
    punctuality: Number(formData.get("punctuality") ?? 5),
    professionalism: Number(formData.get("professionalism") ?? 5),
    text: String(formData.get("text") ?? "").trim(),
  });

  revalidatePath(`/household/bookings/${bookingId}`);
  revalidatePath(`/household/workers/${booking.workerId}`);
  redirect(`/household/bookings/${bookingId}?reviewed=1`);
}

export async function togglePause(formData: FormData) {
  const b = getBooking(String(formData.get("bookingId")));
  if (!b?.schedule) return;
  b.schedule.paused = !b.schedule.paused;
  revalidatePath("/household/team");
  revalidatePath(`/household/bookings/${b.id}`);
}

export async function cancelBooking(formData: FormData) {
  const b = getBooking(String(formData.get("bookingId")));
  if (!b) return;
  b.status = "cancelled";
  revalidatePath("/household");
  revalidatePath(`/household/bookings/${b.id}`);
}

export async function requestReplacement(formData: FormData) {
  const bookingId = String(formData.get("bookingId"));
  await assignReplacement(bookingId);
  revalidatePath(`/household/bookings/${bookingId}`);
  revalidatePath("/household/team");
}

export async function raiseDispute(formData: FormData) {
  const user = await currentUser();
  const bookingId = String(formData.get("bookingId"));
  if (!user) return;
  db().disputes.push({
    id: nextId("dp"),
    bookingId,
    raisedBy: user.role === "worker" ? "worker" : "household",
    raisedByName: user.name,
    reason: String(formData.get("reason") ?? "Other"),
    detail: String(formData.get("detail") ?? ""),
    status: "open",
    notes: [],
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/admin/disputes");
  revalidatePath(`/household/bookings/${bookingId}`);
}

// -------------------------------------------------------------- worker ----

export async function saveWorkerProfile(formData: FormData) {
  const worker = await currentWorker();
  if (!worker) redirect("/login?role=worker");

  const categories = formData.getAll("categories").map(String) as CategoryId[];
  const locality = String(formData.get("locality") || worker.locality);
  const z = zoneFor(locality);

  Object.assign(worker, {
    name: String(formData.get("name") || worker.name),
    locality,
    district: locality,
    location: { lat: z.lat, lng: z.lng },
    categories: categories.length ? categories : worker.categories,
    experienceYears: Number(formData.get("experienceYears") ?? worker.experienceYears),
    languages: String(formData.get("languages") ?? worker.languages.join(", "))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    wage: Number(formData.get("wage") ?? worker.wage),
    bio: String(formData.get("bio") ?? worker.bio),
  });

  revalidatePath("/worker");
  redirect("/worker/verification");
}

export async function saveAvailability(formData: FormData) {
  const worker = await currentWorker();
  if (!worker) return;
  const days = formData.getAll("days").map(Number);
  worker.availableDays = days;
  worker.availableFrom = String(formData.get("from") || worker.availableFrom);
  worker.availableTo = String(formData.get("to") || worker.availableTo);
  revalidatePath("/worker/availability");
  redirect("/worker/availability?saved=1");
}

export async function submitVerificationStep(formData: FormData) {
  const worker = await currentWorker();
  if (!worker) return;
  const rec = db().verifications.find((v) => v.workerId === worker.id);
  if (!rec) return;
  const step = String(formData.get("step"));

  if (step === "govId") {
    const res = await identityProvider.submitId({
      workerId: worker.id,
      docType: String(formData.get("docType") ?? "Aadhaar"),
      docNumber: String(formData.get("docNumber") ?? "0000"),
    });
    rec.govId = {
      status: "pending",
      docType: String(formData.get("docType") ?? "Aadhaar"),
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
  const worker = await currentWorker();
  if (!worker) return;
  await respondToBooking(String(formData.get("bookingId")), String(formData.get("accept")) === "yes");
  revalidatePath("/worker");
  revalidatePath("/household");
  redirect("/worker/jobs");
}

// --------------------------------------------------------------- admin ----

export async function decideVerification(formData: FormData) {
  await decideWorkerVerification(
    String(formData.get("workerId")),
    String(formData.get("decision")) === "approve",
    String(formData.get("note") ?? ""),
  );
  revalidatePath("/admin/verification");
  revalidatePath("/worker/verification");
}

export async function resolveDispute(formData: FormData) {
  const user = await currentUser();
  const d = db().disputes.find((x) => x.id === String(formData.get("disputeId")));
  if (!d) return;
  const resolution = String(formData.get("resolution") ?? "").trim();
  d.notes.push({ at: new Date().toISOString(), by: user?.name ?? "Ops", text: resolution });
  d.status = "resolved";
  d.resolution = resolution;
  d.resolvedAt = new Date().toISOString();
  revalidatePath("/admin/disputes");
}

export async function addDisputeNote(formData: FormData) {
  const user = await currentUser();
  const d = db().disputes.find((x) => x.id === String(formData.get("disputeId")));
  if (!d) return;
  d.notes.push({ at: new Date().toISOString(), by: user?.name ?? "Ops", text: String(formData.get("note") ?? "") });
  revalidatePath("/admin/disputes");
}

export async function moderateReview(formData: FormData) {
  const review = db().reviews.find((r) => r.id === String(formData.get("reviewId")));
  if (!review) return;
  const action = String(formData.get("action"));
  const wasCounted = review.status !== "removed";
  const nowCounted = action !== "remove";
  review.status = nowCounted ? "published" : "removed";
  review.moderationNote = String(formData.get("note") ?? "");
  if (wasCounted !== nowCounted) applyRating(review.workerId, review.rating, nowCounted ? 1 : -1);
  revalidatePath("/admin/reviews");
}
