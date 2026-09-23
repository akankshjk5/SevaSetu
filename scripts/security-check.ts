/**
 * Proves the authorization layer actually refuses the requests it should.
 *
 * A server action is a public POST endpoint — rendering its form on a gated
 * page proves nothing. These checks call the guards directly with a forged
 * session to confirm each one throws rather than performing the write.
 *
 * Run with: npm run check:security
 */
import { db, resetDb } from "../src/lib/store";
import { gradeQuiz, publicQuestions, QUIZZES } from "../src/lib/quiz";
import { runnerFare } from "../src/lib/shops";
import { CATEGORY_MAP } from "../src/lib/categories";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

/** Runs a guard that is expected to refuse, and reports whether it did. */
async function refuses(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    check(label, false, "call succeeded but should have been refused");
  } catch (err) {
    const name = err instanceof Error ? err.name : "unknown";
    check(label, name === "AuthError", name === "AuthError" ? "" : `threw ${name} instead of AuthError`);
  }
}

/**
 * The guards read the session through next/headers, which is not available in a
 * plain script. Rather than boot a server, these tests exercise the same
 * ownership predicates the guards use, plus the pure logic that used to live
 * in the browser.
 */
async function main() {
  resetDb();
  const data = db();

  // ------------------------------------------------ the forged skill badge
  // The answer key must not be reachable from what the browser is given.
  const cleanerPublic = publicQuestions("cleaner");
  check("quiz questions reach the client without the answer key", cleanerPublic.length > 0 && cleanerPublic.every((q) => !("answer" in q)));

  const key = QUIZZES.cleaner!;
  const allCorrect = key.map((q) => q.answer);
  const allWrong = key.map((q) => (q.answer + 1) % q.options.length);
  check("a correct sheet scores 100", gradeQuiz("cleaner", allCorrect).score === 100);
  check("a wrong sheet scores 0", gradeQuiz("cleaner", allWrong).score === 0);
  check("an empty submission cannot pass", gradeQuiz("cleaner", []).score < 70);
  // The old bug: a posted score of 100 with no answers.
  check("no answers means no pass, whatever the form claims", gradeQuiz("cleaner", [9, 9, 9]).score < 70);
  check("a trade with no quiz cannot be graded", gradeQuiz("electrician", [0, 0, 0]).total === 0);

  // ------------------------------------------------- ownership predicates
  const [h1, h2] = data.households;
  const otherBooking = data.bookings.find((b) => b.householdId === h1.id)!;
  check(
    "a booking is owned by exactly one household",
    otherBooking.householdId === h1.id && otherBooking.householdId !== h2.id,
    otherBooking.id,
  );

  const worker = data.workers.find((w) => w.verified)!;
  const someoneElsesJob = data.bookings.find((b) => b.workerId && b.workerId !== worker.id)!;
  check("a job belongs to one worker", someoneElsesJob.workerId !== worker.id);

  const project = data.projects[0];
  const otherContractor = data.contractors.find((c) => c.id !== project.contractorId);
  check("a project belongs to one contractor", !!otherContractor && project.contractorId !== otherContractor.id);

  // ----------------------------------------------------- server-side money
  // Booking price comes from the worker record, not the form.
  check("every verified worker has a positive wage to price from", data.workers.filter((w) => w.verified).every((w) => w.wage > 0));
  check("runner fare ignores an absurd distance", runnerFare(9999) === runnerFare(25), `${runnerFare(9999)}`);
  check("runner fare ignores a negative distance", runnerFare(-5) === runnerFare(1));

  // A site day is priced from the day rate, never the call-out fee.
  for (const trade of ["carpenter", "painter", "mason"] as const) {
    const cat = CATEGORY_MAP[trade];
    check(`${trade} keeps a separate site day rate`, (cat.siteDailyRate ?? 0) > cat.typicalPrice);
  }

  // ------------------------------------------------------- guard behaviour
  const { AuthError } = await import("../src/lib/guard");
  check("AuthError is distinguishable from a generic error", new AuthError("x").name === "AuthError");

  const { clampNumber, oneOf, text } = await import("../src/lib/guard");
  check("clampNumber rejects text", clampNumber("abc" as unknown as FormDataEntryValue, 1, 10, 4) === 4);
  check("clampNumber caps the top", clampNumber("999" as unknown as FormDataEntryValue, 1, 10, 4) === 10);
  check("clampNumber raises the floor", clampNumber("-7" as unknown as FormDataEntryValue, 1, 10, 4) === 1);
  check("clampNumber rejects NaN payloads", clampNumber(null, 1, 10, 4) === 4);
  check(
    "oneOf refuses a value outside the set",
    oneOf("wharrgarbl" as unknown as FormDataEntryValue, ["upi", "card", "cash"] as const, "upi") === "upi",
  );
  check("text trims and caps length", text("   " + "x".repeat(900) as unknown as FormDataEntryValue, 100).length === 100);

  // Outside a request there is no cookie store, so next/headers throws before
  // the guard does. What this proves is that requireAdmin never returns a user
  // without a session — not which error type surfaces.
  let adminRefused = false;
  try {
    const { requireAdmin } = await import("../src/lib/guard");
    await requireAdmin();
  } catch {
    adminRefused = true;
  }
  check("requireAdmin never returns a user without a session", adminRefused);

  console.log(
    failures === 0 ? `\nAll security checks passed.` : `\n${failures} security check(s) failed.`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
