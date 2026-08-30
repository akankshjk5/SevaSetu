import { db } from "./store";
import { CATEGORY_MAP } from "./categories";
import { getWorker } from "./repo";
import type { CategoryId, Project, ProjectAssignment, WorkerProfile } from "./types";

// ------------------------------------------------------- Phase 2: projects

export function getProject(id: string): Project | null {
  return db().projects.find((p) => p.id === id) ?? null;
}

export function contractorProjects(contractorId: string): Project[] {
  return db()
    .projects.filter((p) => p.contractorId === contractorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function projectAssignments(projectId: string): ProjectAssignment[] {
  return db().assignments.filter((a) => a.projectId === projectId);
}

export function workerAssignments(workerId: string): ProjectAssignment[] {
  return db()
    .assignments.filter((a) => a.workerId === workerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getContractor(id: string) {
  return db().contractors.find((c) => c.id === id) ?? null;
}

export function projectWages(projectId: string) {
  const rows = projectAssignments(projectId)
    .filter((a) => a.status === "confirmed" || a.status === "completed")
    .map((a) => ({
      assignment: a,
      worker: getWorker(a.workerId),
      days: a.attendance.length,
      total: a.attendance.length * a.dailyRate,
    }));
  return { rows, total: rows.reduce((s, r) => s + r.total, 0) };
}

/** How many of each required trade are still unfilled. */
export function projectGaps(project: Project) {
  const filled = projectAssignments(project.id).filter((a) => a.status === "confirmed" || a.status === "completed");
  return project.requirements.map((r) => ({
    ...r,
    filledCount: filled.filter((a) => a.trade === r.trade).length,
    missing: Math.max(0, r.count - filled.filter((a) => a.trade === r.trade).length),
  }));
}

// ------------------------------------------------- Phase 3: skill passport

export function workerAssessments(workerId: string) {
  return db().assessments.filter((a) => a.workerId === workerId);
}

export function workerCertifications(workerId: string) {
  return db().certifications.filter((c) => c.workerId === workerId);
}

/** A worker is "Certified" once any trade skill check has been passed. */
export function isCertified(workerId: string): boolean {
  return workerAssessments(workerId).some((a) => a.status === "passed");
}

export function certifiedTrades(workerId: string): CategoryId[] {
  return workerAssessments(workerId)
    .filter((a) => a.status === "passed")
    .map((a) => a.trade);
}

export type PassportEntry = {
  kind: "household" | "site";
  title: string;
  trade: CategoryId;
  date: string;
  hours: number;
  amount: number;
  counterparty: string;
};

/**
 * The passport is derived, never hand-entered: it reads completed Phase 1
 * bookings and completed Phase 2 project assignments.
 */
export function skillPassport(worker: WorkerProfile) {
  const bookings = db()
    .bookings.filter((b) => b.workerId === worker.id && b.status === "completed")
    .map<PassportEntry>((b) => ({
      kind: "household",
      title: CATEGORY_MAP[b.category].name,
      trade: b.category,
      date: (b.completedAt ?? b.date).slice(0, 10),
      hours: Math.round(b.durationMins / 60),
      amount: db().payments.find((p) => p.bookingId === b.id)?.workerPayout ?? 0,
      counterparty: db().households.find((h) => h.id === b.householdId)?.locality ?? "",
    }));

  const site = workerAssignments(worker.id)
    .filter((a) => a.status === "completed")
    .map<PassportEntry>((a) => {
      const project = getProject(a.projectId);
      return {
        kind: "site",
        title: project?.name ?? "Site project",
        trade: a.trade,
        date: (project?.completedAt ?? project?.startDate ?? "").slice(0, 10),
        hours: a.attendance.length * 9,
        amount: a.attendance.length * a.dailyRate,
        counterparty: getContractor(project?.contractorId ?? "")?.companyName ?? "",
      };
    });

  const entries = [...bookings, ...site].sort((a, b) => b.date.localeCompare(a.date));
  return {
    entries,
    verifiedJobs: entries.length,
    hours: entries.reduce((s, e) => s + e.hours, 0),
    trades: [...new Set(entries.map((e) => e.trade))],
    income: entries.reduce((s, e) => s + e.amount, 0),
    assessments: workerAssessments(worker.id),
    certifications: workerCertifications(worker.id),
  };
}

// ------------------------------------------------ Phase 3: training links

export function listingsForTrades(trades: CategoryId[]) {
  return db().listings.filter((l) => trades.includes(l.trade));
}

export function providerListings(providerId: string) {
  return db()
    .listings.filter((l) => l.providerId === providerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ------------------------------------------------------- Phase 5: inbox --

export function partnershipInquiries() {
  return db()
    .inquiries.slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Headline public-value numbers for the partner landing page. Derived from the
 * same aggregated dataset the government dashboard uses.
 */
export function impactSummary() {
  const data = db();
  const completedBookings = data.bookings.filter((b) => b.status === "completed");
  const bookingIncome = completedBookings.reduce(
    (s, b) => s + (data.payments.find((p) => p.bookingId === b.id)?.workerPayout ?? 0),
    0,
  );
  const siteIncome = data.assignments.reduce((s, a) => s + a.attendance.length * a.dailyRate, 0);
  const districts = new Set(data.stats.map((s) => s.district));
  const signals = data.stats.filter((s) => s.trainingDemandSignal > 0).length;

  return {
    workersVerified: data.workers.filter((w) => w.verified).length,
    jobsCompleted: completedBookings.length + data.assignments.filter((a) => a.status === "completed").length,
    incomeDisbursed: bookingIncome + siteIncome,
    districts: districts.size,
    skillSignals: signals,
  };
}
