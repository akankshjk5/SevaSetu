"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, nextId } from "./store";
import { currentContractor, currentProvider, currentUser, currentWorker } from "./session";
import { getWorker } from "./repo";
import { getProject, projectAssignments } from "./repo-phases";
import { scoreWorker } from "./match";
import { notifyProvider } from "./integrations/notify";
import { ZONES } from "./seed";
import { CATEGORIES, siteDayRate } from "./categories";
import { QUIZZES, gradeQuiz } from "./quiz";
import {
  AuthError,
  clampNumber,
  oneOf,
  requireAdmin,
  requireAttendanceParty,
  requireContractor,
  requireOwnAssignment,
  requireOwnProject,
  requireOwnWorkerAssignment,
  requireProvider,
  requireUser,
  requireWorker,
  text,
} from "./guard";
import type { CategoryId, Project, ProjectRequirement } from "./types";

const zoneFor = (name: string) => ZONES.find((z) => z.name === name) ?? ZONES[0];
const ZONE_NAMES = ZONES.map((z) => z.name) as [string, ...string[]];
const TRADE_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];

// ------------------------------------------------- Phase 2: workforce OS --

export async function saveCompanyProfile(formData: FormData) {
  const contractor = await requireContractor();
  const district = oneOf(formData.get("district"), ZONE_NAMES, contractor.district as (typeof ZONE_NAMES)[number]);
  Object.assign(contractor, {
    companyName: text(formData.get("companyName"), 120) || contractor.companyName,
    contactName: text(formData.get("contactName"), 80) || contractor.contactName,
    gst: text(formData.get("gst"), 20),
    about: text(formData.get("about"), 600),
    district,
    location: zoneFor(district),
  });
  revalidatePath("/contractor/company");
  redirect("/contractor/company?saved=1");
}

/**
 * Creating a project immediately shortlists workers per trade using the same
 * scoring function the household side uses — one matching engine, two UIs.
 */
export async function createProject(formData: FormData) {
  const contractor = await requireContractor();
  const district = oneOf(formData.get("district"), ZONE_NAMES, contractor.district as (typeof ZONE_NAMES)[number]);
  const trades = formData.getAll("trades").map(String) as CategoryId[];
  const requirements: ProjectRequirement[] = trades.map((trade) => ({
    trade,
    count: clampNumber(formData.get(`count_${trade}`), 1, 200, 1),
    dailyRate: clampNumber(formData.get(`rate_${trade}`), 1, 50000, siteDayRate(trade)),
  }));

  const startDate = String(formData.get("startDate") || new Date().toISOString().slice(0, 10));
  const hoursFrom = String(formData.get("hoursFrom") || "08:00");

  const project: Project = {
    id: nextId("p"),
    contractorId: contractor.id,
    name: text(formData.get("name"), 120) || "Untitled project",
    siteAddress: text(formData.get("siteAddress"), 200) || `${district}, Jaipur`,
    district,
    location: zoneFor(district),
    startDate,
    durationDays: clampNumber(formData.get("durationDays"), 1, 730, 30),
    hoursFrom,
    hoursTo: String(formData.get("hoursTo") || "18:00"),
    requirements: requirements.length ? requirements : [{ trade: "helper", count: 1, dailyRate: 550 }],
    status: "hiring",
    createdAt: new Date().toISOString(),
    // Site work is a daily recurring schedule — the Phase 1 scheduling shape.
    schedule: { days: [1, 2, 3, 4, 5, 6], time: hoursFrom, paused: false, startedAt: startDate },
  };
  db().projects.push(project);

  shortlistForProject(project);

  revalidatePath("/contractor");
  redirect(`/contractor/projects/${project.id}`);
}

/** Ranks verified workers per required trade and stores the top matches. */
function shortlistForProject(project: Project) {
  for (const req of project.requirements) {
    const ranked = db()
      .workers.filter((w) => w.verified && w.categories.includes(req.trade))
      .map((w) =>
        scoreWorker(w, {
          category: req.trade,
          location: project.location,
          days: project.schedule.days,
          time: project.hoursFrom,
          budget: req.dailyRate,
        }),
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(3, req.count + 2));

    for (const match of ranked) {
      const already = db().assignments.find((a) => a.projectId === project.id && a.workerId === match.worker.id);
      if (already) continue;
      db().assignments.push({
        id: nextId("pa"),
        projectId: project.id,
        workerId: match.worker.id,
        trade: req.trade,
        dailyRate: req.dailyRate,
        status: "shortlisted",
        createdAt: new Date().toISOString(),
        attendance: [],
        paidDays: 0,
      });
    }
  }
}

export async function requestTeam(formData: FormData) {
  const projectId = text(formData.get("projectId"), 60);
  const { project } = await requireOwnProject(projectId);

  for (const a of projectAssignments(projectId)) {
    if (a.status !== "shortlisted") continue;
    a.status = "requested";
    const worker = getWorker(a.workerId);
    if (worker) {
      await notifyProvider.send({
        to: worker.phone,
        template: "site_job_request",
        vars: { project: project.name, rate: String(a.dailyRate), start: project.startDate },
      });
    }
  }
  revalidatePath(`/contractor/projects/${projectId}`);
  revalidatePath("/worker/jobs");
}

export async function requestOneWorker(formData: FormData) {
  const { assignment: a } = await requireOwnAssignment(text(formData.get("assignmentId"), 60));
  if (a.status !== "shortlisted") return;
  a.status = "requested";
  revalidatePath(`/contractor/projects/${a.projectId}`);
  revalidatePath("/worker/jobs");
}

export async function respondToAssignment(formData: FormData) {
  // Only the worker the offer was made to may answer it.
  const { assignment: a } = await requireOwnWorkerAssignment(text(formData.get("assignmentId"), 60));
  if (a.status !== "requested" && a.status !== "shortlisted") throw new AuthError("This offer has already been answered");
  a.status = String(formData.get("accept")) === "yes" ? "confirmed" : "declined";

  const project = getProject(a.projectId);
  if (project && a.status === "confirmed" && project.status === "hiring") {
    const gaps = project.requirements.every(
      (r) =>
        projectAssignments(project.id).filter((x) => x.trade === r.trade && x.status === "confirmed").length >= r.count,
    );
    if (gaps) project.status = "running";
  }
  revalidatePath("/worker/jobs");
  revalidatePath(`/contractor/projects/${a.projectId}`);
  redirect("/worker/jobs");
}

/**
 * Demo stand-in for QR / GPS geofence check-in. The record it writes — one
 * dated attendance row per worker per project — is what production would store.
 */
export async function siteCheckIn(formData: FormData) {
  // Attendance drives payroll, so only the worker on the assignment or the
  // contractor running the project may record a day.
  const a = await requireAttendanceParty(text(formData.get("assignmentId"), 60));
  if (a.status !== "confirmed") throw new AuthError("Attendance only counts on a confirmed assignment");
  const today = new Date().toISOString().slice(0, 10);
  if (!a.attendance.includes(today)) a.attendance.push(today);
  a.paidDays = a.attendance.length;
  revalidatePath(`/contractor/projects/${a.projectId}`);
  revalidatePath("/worker/jobs");
}

export async function completeProject(formData: FormData) {
  const { project } = await requireOwnProject(text(formData.get("projectId"), 60));
  project.status = "completed";
  project.completedAt = new Date().toISOString();
  for (const a of projectAssignments(project.id)) {
    if (a.status === "confirmed") a.status = "completed";
  }
  revalidatePath(`/contractor/projects/${project.id}`);
  revalidatePath("/worker");
}

export async function rateAssignment(formData: FormData) {
  const user = await requireUser();
  // Each side rates the other, and only on their own assignment.
  const a =
    user.role === "contractor"
      ? (await requireOwnAssignment(text(formData.get("assignmentId"), 60))).assignment
      : (await requireOwnWorkerAssignment(text(formData.get("assignmentId"), 60))).assignment;
  if (a.status !== "completed") throw new AuthError("Rate after the work is finished");
  const rating = clampNumber(formData.get("rating"), 1, 5, 5);
  const review = text(formData.get("text"), 600);

  if (user.role === "contractor") {
    if (a.contractorRating) throw new AuthError("Already rated");
    a.contractorRating = rating;
    a.contractorReview = review;
    const worker = getWorker(a.workerId);
    if (worker) {
      const total = worker.rating * worker.ratingCount + rating;
      worker.ratingCount += 1;
      worker.rating = Math.round((total / worker.ratingCount) * 10) / 10;
    }
  } else {
    if (a.workerRating) throw new AuthError("Already rated");
    a.workerRating = rating;
    a.workerReview = review;
    const project = getProject(a.projectId);
    const contractor = db().contractors.find((c) => c.id === project?.contractorId);
    if (contractor) {
      const total = contractor.rating * contractor.ratingCount + rating;
      contractor.ratingCount += 1;
      contractor.rating = Math.round((total / contractor.ratingCount) * 10) / 10;
    }
  }
  revalidatePath(`/contractor/projects/${a.projectId}`);
  revalidatePath("/worker/passport");
}

// ----------------------------------------------- Phase 3: skill passport --

const PRACTICAL_TRADES: CategoryId[] = ["electrician", "plumber"];

export async function submitAssessment(formData: FormData) {
  const worker = await requireWorker();
  const trade = oneOf(formData.get("trade"), worker.categories, worker.categories[0]);
  if (!trade) throw new AuthError("Add a trade to your profile first");
  if (PRACTICAL_TRADES.includes(trade)) throw new AuthError("This trade needs a practical check, not a quiz");

  // Grade from the submitted answers against the key held on the server.
  const answers = (QUIZZES[trade] ?? []).map((_, i) => clampNumber(formData.get(`a${i}`), 0, 9, -1));
  const { score, total } = gradeQuiz(trade, answers);
  if (!total) throw new AuthError("No quiz exists for this trade");
  const passed = score >= 70;

  const existing = db().assessments.find((a) => a.workerId === worker.id && a.trade === trade && a.mode === "quiz");
  const record = {
    id: existing?.id ?? nextId("sa"),
    workerId: worker.id,
    trade,
    mode: "quiz" as const,
    status: passed ? ("passed" as const) : ("failed" as const),
    score,
    takenAt: new Date().toISOString(),
  };
  if (existing) Object.assign(existing, record);
  else db().assessments.push(record);

  revalidatePath("/worker/passport");
  redirect(`/worker/passport?score=${score}`);
}

export async function schedulePractical(formData: FormData) {
  const worker = await requireWorker();
  const trade = oneOf(formData.get("trade"), PRACTICAL_TRADES, PRACTICAL_TRADES[0]);
  if (!worker.categories.includes(trade)) throw new AuthError("Not one of your trades");

  const when = new Date();
  when.setDate(when.getDate() + 3);
  const existing = db().assessments.find((a) => a.workerId === worker.id && a.trade === trade && a.mode === "practical");
  const record = {
    id: existing?.id ?? nextId("sa"),
    workerId: worker.id,
    trade,
    mode: "practical" as const,
    status: "scheduled" as const,
    centre: "Jaipur Skill Centre, Mansarovar",
    scheduledFor: when.toISOString().slice(0, 10),
  };
  if (existing) Object.assign(existing, record);
  else db().assessments.push(record);

  revalidatePath("/worker/passport");
}

export async function addCertification(formData: FormData) {
  const worker = await requireWorker();
  const name = text(formData.get("name"), 120);
  if (!name) return;
  db().certifications.push({
    id: nextId("cert"),
    workerId: worker.id,
    name,
    issuer: text(formData.get("issuer"), 120),
    year: clampNumber(formData.get("year"), 1950, new Date().getFullYear(), new Date().getFullYear()),
    verified: false,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/worker/passport");
}

// -------------------------------------------- Phase 3: training provider --

export async function publishListing(formData: FormData) {
  const provider = await requireProvider();
  db().listings.push({
    id: nextId("tl"),
    providerId: provider.id,
    providerName: provider.orgName,
    title: text(formData.get("title"), 120) || "Untitled course",
    trade: oneOf(formData.get("trade"), TRADE_IDS, "cleaner"),
    district: oneOf(formData.get("district"), ZONE_NAMES, provider.district as (typeof ZONE_NAMES)[number]),
    durationDays: clampNumber(formData.get("durationDays"), 1, 365, 10),
    fee: clampNumber(formData.get("fee"), 0, 500000, 0),
    seats: clampNumber(formData.get("seats"), 1, 1000, 20),
    about: text(formData.get("about"), 800),
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/training");
  redirect("/training?published=1");
}

// ----------------------------------------------- Phase 5: partnership -----

export async function submitInquiry(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !email) redirect("/partners?error=1#contact");

  db().inquiries.push({
    id: nextId("pi"),
    name,
    department: String(formData.get("department") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    email,
    message: String(formData.get("message") ?? "").trim(),
    createdAt: new Date().toISOString(),
    status: "new",
  });
  revalidatePath("/admin/inquiries");
  redirect("/partners?sent=1#contact");
}

export async function markInquiryContacted(formData: FormData) {
  await requireAdmin();
  const inquiry = db().inquiries.find((i) => i.id === text(formData.get("inquiryId"), 60));
  if (inquiry) inquiry.status = "contacted";
  revalidatePath("/admin/inquiries");
}
