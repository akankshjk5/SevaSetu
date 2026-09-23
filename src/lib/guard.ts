import { db } from "./store";
import { currentContractor, currentHousehold, currentProvider, currentUser, currentWorker } from "./session";
import { getBooking } from "./repo";
import type {
  Booking,
  ContractorProfile,
  HouseholdProfile,
  ProjectAssignment,
  RapidOrder,
  TrainingProviderProfile,
  User,
  WorkerProfile,
} from "./types";

/**
 * Authorization for server actions.
 *
 * A server action is a public POST endpoint. Rendering a form only on a gated
 * page is not a security boundary — anyone who can send the request reaches the
 * action directly. Every action therefore starts by proving, from the session,
 * who the caller is and that the row they named is theirs.
 *
 * These throw rather than returning null: a missed check should fail loudly in
 * the log, not continue with an unauthorised write.
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new AuthError("Not signed in");
  return user;
}

export async function requireHousehold(): Promise<HouseholdProfile> {
  const household = await currentHousehold();
  if (!household) throw new AuthError("Not signed in as a household");
  return household;
}

export async function requireWorker(): Promise<WorkerProfile> {
  const worker = await currentWorker();
  if (!worker) throw new AuthError("Not signed in as a worker");
  return worker;
}

export async function requireContractor(): Promise<ContractorProfile> {
  const contractor = await currentContractor();
  if (!contractor) throw new AuthError("Not signed in as a contractor");
  return contractor;
}

export async function requireProvider(): Promise<TrainingProviderProfile> {
  const provider = await currentProvider();
  if (!provider) throw new AuthError("Not signed in as a training provider");
  return provider;
}

/** Ops-only actions: verification decisions, dispute resolution, moderation. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("Admin only");
  return user;
}

// ------------------------------------------------------------ ownership ----

/** A booking the signed-in household actually owns. */
export async function requireOwnBooking(bookingId: string): Promise<{ household: HouseholdProfile; booking: Booking }> {
  const household = await requireHousehold();
  const booking = getBooking(bookingId);
  if (!booking || booking.householdId !== household.id) throw new AuthError("Booking not found for this household");
  return { household, booking };
}

/** A booking the signed-in worker is assigned to. */
export async function requireAssignedBooking(bookingId: string): Promise<{ worker: WorkerProfile; booking: Booking }> {
  const worker = await requireWorker();
  const booking = getBooking(bookingId);
  if (!booking || booking.workerId !== worker.id) throw new AuthError("Job not assigned to this worker");
  return { worker, booking };
}

/**
 * A booking either side of it may move — the household advancing the demo
 * tracker, or the worker marking progress from their own phone.
 */
export async function requireBookingParty(bookingId: string): Promise<Booking> {
  const user = await requireUser();
  const booking = getBooking(bookingId);
  if (!booking) throw new AuthError("Booking not found");

  if (user.role === "household") {
    const household = db().households.find((h) => h.userId === user.id);
    if (household && booking.householdId === household.id) return booking;
  }
  if (user.role === "worker") {
    const worker = db().workers.find((w) => w.userId === user.id);
    if (worker && booking.workerId === worker.id) return booking;
  }
  if (user.role === "admin") return booking;

  throw new AuthError("Not a party to this booking");
}

/** A project belonging to the signed-in contractor. */
export async function requireOwnProject(projectId: string) {
  const contractor = await requireContractor();
  const project = db().projects.find((p) => p.id === projectId);
  if (!project || project.contractorId !== contractor.id) throw new AuthError("Project not found for this contractor");
  return { contractor, project };
}

/** An assignment on a project the contractor owns. */
export async function requireOwnAssignment(assignmentId: string): Promise<{ contractor: ContractorProfile; assignment: ProjectAssignment }> {
  const contractor = await requireContractor();
  const assignment = db().assignments.find((a) => a.id === assignmentId);
  if (!assignment) throw new AuthError("Assignment not found");
  const project = db().projects.find((p) => p.id === assignment.projectId);
  if (!project || project.contractorId !== contractor.id) throw new AuthError("Assignment is on another contractor's project");
  return { contractor, assignment };
}

/** An assignment offered to the signed-in worker. */
export async function requireOwnWorkerAssignment(assignmentId: string): Promise<{ worker: WorkerProfile; assignment: ProjectAssignment }> {
  const worker = await requireWorker();
  const assignment = db().assignments.find((a) => a.id === assignmentId);
  if (!assignment || assignment.workerId !== worker.id) throw new AuthError("Assignment not offered to this worker");
  return { worker, assignment };
}

/** A rapid order the signed-in household placed. */
export async function requireOwnRapidOrder(orderId: string): Promise<{ household: HouseholdProfile; order: RapidOrder }> {
  const household = await requireHousehold();
  const order = db().rapidOrders.find((o) => o.id === orderId);
  if (!order || order.householdId !== household.id) throw new AuthError("Order not found for this household");
  return { household, order };
}

/**
 * Attendance is money: a day recorded is a day paid. Either the worker on the
 * assignment or the contractor whose project it is may record one.
 */
export async function requireAttendanceParty(assignmentId: string): Promise<ProjectAssignment> {
  const user = await requireUser();
  const assignment = db().assignments.find((a) => a.id === assignmentId);
  if (!assignment) throw new AuthError("Assignment not found");

  if (user.role === "worker") {
    const worker = db().workers.find((w) => w.userId === user.id);
    if (worker && assignment.workerId === worker.id) return assignment;
  }
  if (user.role === "contractor") {
    const contractor = db().contractors.find((c) => c.userId === user.id);
    const project = db().projects.find((p) => p.id === assignment.projectId);
    if (contractor && project && project.contractorId === contractor.id) return assignment;
  }
  throw new AuthError("Not a party to this assignment");
}

// ------------------------------------------------------------ validation ---

/**
 * FormData is untrusted. A number that arrives outside its sane range is a
 * tampered request, not a rounding problem, so it is clamped rather than used.
 */
export function clampNumber(value: FormDataEntryValue | null, min: number, max: number, fallback: number): number {
  // A missing field means "use the default". Without this, Number(null) is 0,
  // which clamps to the minimum — so an absent duration silently became 15
  // minutes rather than the intended 90.
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** One of a fixed set, or the fallback — never whatever the form said. */
export function oneOf<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T): T {
  const s = String(value ?? "");
  return (allowed as readonly string[]).includes(s) ? (s as T) : fallback;
}

/** Trimmed, length-capped free text. */
export function text(value: FormDataEntryValue | null, maxLength = 500): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}
