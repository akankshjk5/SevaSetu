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
import { CATEGORY_MAP } from "./categories";
import type { CategoryId, Project, ProjectRequirement } from "./types";

const zoneFor = (name: string) => ZONES.find((z) => z.name === name) ?? ZONES[0];

// ------------------------------------------------- Phase 2: workforce OS --

export async function saveCompanyProfile(formData: FormData) {
  const contractor = await currentContractor();
  if (!contractor) redirect("/login?role=contractor");
  const district = String(formData.get("district") || contractor.district);
  Object.assign(contractor, {
    companyName: String(formData.get("companyName") || contractor.companyName),
    contactName: String(formData.get("contactName") || contractor.contactName),
    gst: String(formData.get("gst") ?? contractor.gst),
    about: String(formData.get("about") ?? contractor.about),
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
  const contractor = await currentContractor();
  if (!contractor) redirect("/login?role=contractor");

  const district = String(formData.get("district") || contractor.district);
  const trades = formData.getAll("trades").map(String) as CategoryId[];
  const requirements: ProjectRequirement[] = trades.map((trade) => ({
    trade,
    count: Math.max(1, Number(formData.get(`count_${trade}`) ?? 1)),
    dailyRate: Math.max(1, Number(formData.get(`rate_${trade}`) ?? CATEGORY_MAP[trade].typicalPrice)),
  }));

  const startDate = String(formData.get("startDate") || new Date().toISOString().slice(0, 10));
  const hoursFrom = String(formData.get("hoursFrom") || "08:00");

  const project: Project = {
    id: nextId("p"),
    contractorId: contractor.id,
    name: String(formData.get("name") || "Untitled project"),
    siteAddress: String(formData.get("siteAddress") || `${district}, Jaipur`),
    district,
    location: zoneFor(district),
    startDate,
    durationDays: Math.max(1, Number(formData.get("durationDays") ?? 30)),
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
  const projectId = String(formData.get("projectId"));
  const project = getProject(projectId);
  if (!project) return;

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
  const a = db().assignments.find((x) => x.id === String(formData.get("assignmentId")));
  if (!a || a.status !== "shortlisted") return;
  a.status = "requested";
  revalidatePath(`/contractor/projects/${a.projectId}`);
  revalidatePath("/worker/jobs");
}

export async function respondToAssignment(formData: FormData) {
  const worker = await currentWorker();
  const a = db().assignments.find((x) => x.id === String(formData.get("assignmentId")));
  if (!worker || !a) return;
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
  const a = db().assignments.find((x) => x.id === String(formData.get("assignmentId")));
  if (!a) return;
  const today = new Date().toISOString().slice(0, 10);
  if (!a.attendance.includes(today)) a.attendance.push(today);
  a.paidDays = a.attendance.length;
  revalidatePath(`/contractor/projects/${a.projectId}`);
  revalidatePath("/worker/jobs");
}

export async function completeProject(formData: FormData) {
  const project = getProject(String(formData.get("projectId")));
  if (!project) return;
  project.status = "completed";
  project.completedAt = new Date().toISOString();
  for (const a of projectAssignments(project.id)) {
    if (a.status === "confirmed") a.status = "completed";
  }
  revalidatePath(`/contractor/projects/${project.id}`);
  revalidatePath("/worker");
}

export async function rateAssignment(formData: FormData) {
  const user = await currentUser();
  const a = db().assignments.find((x) => x.id === String(formData.get("assignmentId")));
  if (!user || !a) return;
  const rating = Number(formData.get("rating") ?? 5);
  const text = String(formData.get("text") ?? "");

  if (user.role === "contractor") {
    a.contractorRating = rating;
    a.contractorReview = text;
    const worker = getWorker(a.workerId);
    if (worker) {
      const total = worker.rating * worker.ratingCount + rating;
      worker.ratingCount += 1;
      worker.rating = Math.round((total / worker.ratingCount) * 10) / 10;
    }
  } else {
    a.workerRating = rating;
    a.workerReview = text;
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
  const worker = await currentWorker();
  if (!worker) redirect("/login?role=worker");
  const trade = String(formData.get("trade")) as CategoryId;
  const score = Number(formData.get("score") ?? 0);
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
  const worker = await currentWorker();
  if (!worker) return;
  const trade = String(formData.get("trade")) as CategoryId;
  if (!PRACTICAL_TRADES.includes(trade)) return;

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
  const worker = await currentWorker();
  if (!worker) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  db().certifications.push({
    id: nextId("cert"),
    workerId: worker.id,
    name,
    issuer: String(formData.get("issuer") ?? "").trim(),
    year: Number(formData.get("year") ?? new Date().getFullYear()),
    verified: false,
    createdAt: new Date().toISOString(),
  });
  revalidatePath("/worker/passport");
}

// -------------------------------------------- Phase 3: training provider --

export async function publishListing(formData: FormData) {
  const provider = await currentProvider();
  if (!provider) redirect("/login?role=training");
  db().listings.push({
    id: nextId("tl"),
    providerId: provider.id,
    providerName: provider.orgName,
    title: String(formData.get("title") || "Untitled course"),
    trade: String(formData.get("trade")) as CategoryId,
    district: String(formData.get("district") || provider.district),
    durationDays: Number(formData.get("durationDays") ?? 10),
    fee: Number(formData.get("fee") ?? 0),
    seats: Number(formData.get("seats") ?? 20),
    about: String(formData.get("about") ?? ""),
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
  const inquiry = db().inquiries.find((i) => i.id === String(formData.get("inquiryId")));
  if (inquiry) inquiry.status = "contacted";
  revalidatePath("/admin/inquiries");
}
