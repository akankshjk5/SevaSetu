import { buildSeed, type SeedData } from "./seed";

/**
 * Prototype persistence layer.
 *
 * Everything lives in one in-process singleton so the demo can be clicked
 * through end to end without a database. Every read/write in the app goes
 * through `db()` and the helpers in `repo.ts`; swapping this file for a
 * Postgres/PostGIS client is the only change needed to persist for real.
 */
const globalRef = globalThis as unknown as { __swpDb?: SeedData };

export function db(): SeedData {
  if (!globalRef.__swpDb) globalRef.__swpDb = buildSeed();
  return globalRef.__swpDb;
}

export function resetDb() {
  globalRef.__swpDb = buildSeed();
}

export function nextId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
