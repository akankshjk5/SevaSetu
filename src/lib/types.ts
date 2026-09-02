import type { Locale } from "@/i18n/config";

// Core domain model. Kept provider-agnostic so the in-memory store used by this
// prototype can be replaced by Postgres/PostGIS without touching feature code.

export type Role =
  | "household"
  | "worker"
  | "contractor"
  | "training"
  | "admin"
  | "government";

export type CategoryId =
  | "cleaner"
  | "cook"
  | "house-helper"
  | "gardener"
  | "plumber"
  | "electrician"
  | "mover"
  // Phase 2 site trades. Kept in the same enum so one matching engine and one
  // set of aggregated stats cover both household and construction work.
  | "mason"
  | "carpenter"
  | "painter"
  | "helper"
  | "bar-bender";

export type ServiceCategory = {
  id: CategoryId;
  name: string;
  icon: string;
  /** recurring = daily/weekly domestic help, oneoff = call-out trades */
  kind: "recurring" | "oneoff" | "site";
  blurb: string;
  /** indicative monthly wage (recurring) or per-visit price (one-off), in ₹ */
  typicalPrice: number;
  priceUnit: "per month" | "per visit" | "per day";
  /** Household categories, site categories, or trades serving both. */
  domain: "household" | "site" | "both";
  /**
   * Day rate for a trade that also works on sites. A carpenter charges per
   * visit for a household repair and per day on a project — one number cannot
   * mean both, and paying a site day at the call-out rate underpays by half.
   */
  siteDailyRate?: number;
};

export type LatLng = { lat: number; lng: number };

export type User = {
  id: string;
  role: Role;
  name: string;
  phone: string;
  createdAt: string;
  /** Saved language preference, so it follows the user across devices. */
  language?: Locale;
  /**
   * Easy mode: larger type, bigger targets, icon-first layouts and fewer words.
   * Built for workers who may read little — but offered to everyone, because
   * plenty of households want the simpler screen too.
   */
  simpleMode?: boolean;
};

export type VerificationStepStatus = "not-started" | "pending" | "complete" | "rejected";

export type VerificationRecord = {
  workerId: string;
  govId: { status: VerificationStepStatus; docType?: string; docNumberMasked?: string; submittedAt?: string };
  policeCheck: { status: VerificationStepStatus; submittedAt?: string; clearedAt?: string };
  skillCheck: { status: VerificationStepStatus; assessor?: string; score?: number; clearedAt?: string };
  insurance: { status: VerificationStepStatus; policyNo?: string; cover?: number };
  reviewerNote?: string;
  decidedAt?: string;
  submittedAt?: string;
};

export type WorkerProfile = {
  id: string;
  userId: string;
  name: string;
  photo: string; // initials-avatar seed colour handled in UI
  phone: string;
  locality: string;
  district: string;
  location: LatLng;
  categories: CategoryId[];
  experienceYears: number;
  languages: string[];
  /** ₹ per month for recurring categories, ₹ per visit for one-off trades */
  wage: number;
  bio: string;
  rating: number;
  /** how many rated jobs the average is built from */
  ratingCount: number;
  jobsCompleted: number;
  /** 0-6 = Sun-Sat */
  availableDays: number[];
  availableFrom: string; // "08:00"
  availableTo: string; // "13:00"
  verified: boolean;
  status: "active" | "onboarding" | "suspended";
  joinedAt: string;
};

export type HouseholdProfile = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  addressLine: string;
  locality: string;
  district: string;
  location: LatLng;
  savedLocations: { label: string; addressLine: string; location: LatLng }[];
};

export type BookingType = "one-time" | "daily" | "weekly" | "recurring";

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "en-route"
  | "arrived"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "declined";

export type RecurringSchedule = {
  days: number[];
  time: string;
  paused: boolean;
  startedAt: string;
};

export type Booking = {
  id: string;
  householdId: string;
  workerId: string | null;
  category: CategoryId;
  type: BookingType;
  status: BookingStatus;
  addressLine: string;
  locality: string;
  district: string;
  location: LatLng;
  date: string; // ISO date of next/only visit
  time: string;
  durationMins: number;
  price: number;
  notes?: string;
  schedule?: RecurringSchedule;
  paymentId?: string;
  reviewId?: string;
  createdAt: string;
  completedAt?: string;
  /** platform-paid bookings carry insurance + replacement guarantee */
  onPlatformPayment: boolean;
  /** When the job card was delivered to the worker (WhatsApp/SMS). */
  notifiedAt?: string;
};

export type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  platformFee: number;
  workerPayout: number;
  method: "upi" | "card" | "cash";
  status: "pending" | "paid" | "released" | "failed";
  paidAt?: string;
  payoutDueAt?: string;
  reference: string;
};

export type Review = {
  id: string;
  bookingId: string;
  workerId: string;
  householdId: string;
  householdName: string;
  quality: number;
  punctuality: number;
  professionalism: number;
  rating: number;
  text: string;
  verifiedJob: boolean;
  createdAt: string;
  status: "published" | "flagged" | "removed";
  moderationNote?: string;
};

export type Dispute = {
  id: string;
  bookingId: string;
  raisedBy: "household" | "worker";
  raisedByName: string;
  reason: string;
  detail: string;
  status: "open" | "resolved";
  notes: { at: string; by: string; text: string }[];
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type AggregatedStat = {
  district: string;
  trade: CategoryId;
  period: string; // "2026-08"
  demand: number;
  supply: number;
  verifiedWorkers: number;
  filled: number;
  avgWage: number;
  trainingDemandSignal: number; // 0-100
};

export type Session = { userId: string; role: Role };

// ------------------------------------------------- Phase 2: workforce OS --

export type ContractorProfile = {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  phone: string;
  gst: string;
  district: string;
  location: LatLng;
  about: string;
  rating: number;
  ratingCount: number;
  projectsCompleted: number;
};

export type ProjectStatus = "planning" | "hiring" | "running" | "completed";

export type ProjectRequirement = { trade: CategoryId; count: number; dailyRate: number };

export type Project = {
  id: string;
  contractorId: string;
  name: string;
  siteAddress: string;
  district: string;
  location: LatLng;
  startDate: string;
  durationDays: number;
  hoursFrom: string;
  hoursTo: string;
  requirements: ProjectRequirement[];
  status: ProjectStatus;
  createdAt: string;
  completedAt?: string;
  /**
   * Site work repeats daily for the run of the project, so it reuses the same
   * RecurringSchedule shape the household side uses. One scheduling engine.
   */
  schedule: RecurringSchedule;
};

export type AssignmentStatus = "shortlisted" | "requested" | "confirmed" | "declined" | "completed";

export type ProjectAssignment = {
  id: string;
  projectId: string;
  workerId: string;
  trade: CategoryId;
  dailyRate: number;
  status: AssignmentStatus;
  createdAt: string;
  /** ISO dates the worker checked in on site. */
  attendance: string[];
  paidDays: number;
  /** Contractor's rating of the worker, and the worker's rating of the site. */
  contractorRating?: number;
  contractorReview?: string;
  workerRating?: number;
  workerReview?: string;
};

// ----------------------------------------------- Phase 3: skill passport --

export type SkillAssessment = {
  id: string;
  workerId: string;
  trade: CategoryId;
  /** Quiz for low-risk trades, on-site practical for electrician/plumber. */
  mode: "quiz" | "practical";
  status: "scheduled" | "passed" | "failed";
  score?: number;
  centre?: string;
  scheduledFor?: string;
  takenAt?: string;
};

export type Certification = {
  id: string;
  workerId: string;
  name: string;
  issuer: string;
  year: number;
  /** Uploaded by the worker; verified once ops confirms the certificate. */
  verified: boolean;
  createdAt: string;
};

export type TrainingProviderProfile = {
  id: string;
  userId: string;
  orgName: string;
  contactName: string;
  phone: string;
  district: string;
  about: string;
};

export type TrainingListing = {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  trade: CategoryId;
  district: string;
  durationDays: number;
  fee: number;
  seats: number;
  about: string;
  createdAt: string;
};

// ----------------------------------------------- Phase 5: partnership ----

export type PartnershipInquiry = {
  id: string;
  name: string;
  department: string;
  state: string;
  email: string;
  message: string;
  createdAt: string;
  status: "new" | "contacted";
};

// --------------------------------------------- Rapid services (hyperlocal) --

export type RapidOrderKind = "dukaan" | "minutes" | "runner";

export type RapidOrderStatus = "placed" | "assigned" | "picked-up" | "delivered" | "cancelled";

/**
 * A hyperlocal order: a shop pickup, an urgent trade call-out, or an errand.
 * It reuses the platform's worker pool and notification path rather than
 * running as a separate system — the rider is a verified worker, and the job
 * card that reaches them is the same one a household booking sends.
 */
export type RapidOrder = {
  id: string;
  kind: RapidOrderKind;
  householdId: string;
  /** Assigned runner or tradesperson, once one is found. */
  workerId: string | null;
  locality: string;
  addressLine: string;
  /** Dukaan orders: the shop being sent to. */
  shopId?: string;
  shopName?: string;
  /** Minutes orders: which trade was called. */
  trade?: CategoryId;
  /** Runner orders: the distance the fare was computed from. */
  distanceKm?: number;
  notes?: string;
  /** Computed on the server — never taken from the client. */
  fee: number;
  etaMins: number;
  status: RapidOrderStatus;
  createdAt: string;
  notifiedAt?: string;
};
