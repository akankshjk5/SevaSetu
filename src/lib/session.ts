import { cookies } from "next/headers";
import { db } from "./store";
import type {
  ContractorProfile,
  HouseholdProfile,
  Role,
  Session,
  TrainingProviderProfile,
  User,
  WorkerProfile,
} from "./types";

const COOKIE = "swp_session";

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Session;
    return s?.userId ? s : null;
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  (await cookies()).set(COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const s = await getSession();
  if (!s) return null;
  return db().users.find((u) => u.id === s.userId) ?? null;
}

export async function requireRole(role: Role): Promise<User | null> {
  const u = await currentUser();
  return u && u.role === role ? u : null;
}

export async function currentHousehold(): Promise<HouseholdProfile | null> {
  const u = await currentUser();
  if (!u || u.role !== "household") return null;
  return db().households.find((h) => h.userId === u.id) ?? null;
}

export async function currentWorker(): Promise<WorkerProfile | null> {
  const u = await currentUser();
  if (!u || u.role !== "worker") return null;
  return db().workers.find((w) => w.userId === u.id) ?? null;
}

export async function currentContractor(): Promise<ContractorProfile | null> {
  const u = await currentUser();
  if (!u || u.role !== "contractor") return null;
  return db().contractors.find((c) => c.userId === u.id) ?? null;
}

export async function currentProvider(): Promise<TrainingProviderProfile | null> {
  const u = await currentUser();
  if (!u || u.role !== "training") return null;
  return db().providers.find((p) => p.userId === u.id) ?? null;
}
