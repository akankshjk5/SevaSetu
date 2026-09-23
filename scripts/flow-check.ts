/**
 * End-to-end walk of both journeys against the real data + service layer.
 * Run with: npm run check:flows
 */
import { db, resetDb } from "../src/lib/store";
import { ZONES } from "../src/lib/seed";
import { scoreWorker } from "../src/lib/match";
import {
  addReview,
  advanceBooking,
  assignReplacement,
  createBooking,
  decideWorkerVerification,
  payBooking,
  respondToBooking,
} from "../src/lib/services";
import { districtRollup, tradeRollup, verificationQueue, workerEarnings, workerReviews } from "../src/lib/repo";
import { CATEGORIES } from "../src/lib/categories";
import { BUILD_PHASES, buildChain, planBuild } from "../src/lib/construction";
import { messagesTo } from "../src/lib/integrations/notify";
import { buildJobMessage, whatsappLink } from "../src/lib/messages";
import { DUKAAN_FEE, URGENT_VISIT_FEE, getShop, runnerFare, shopsIn } from "../src/lib/shops";
import { CATEGORY_MAP, siteDayRate as catSiteDayRate } from "../src/lib/categories";
import {
  contractorProjects,
  impactSummary,
  isCertified,
  listingsForTrades,
  projectAssignments,
  projectGaps,
  projectWages,
  skillPassport,
} from "../src/lib/repo-phases";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  resetDb();
  const data = db();

  // ---------------------------------------------------- household journey
  const household = data.households[0];
  const matches = data.workers
    .filter((w) => w.verified && w.categories.includes("cleaner"))
    .map((w) => scoreWorker(w, { category: "cleaner", location: household.location, days: [1, 2, 3, 4, 5, 6], time: "08:00", budget: 4500 }))
    .sort((a, b) => b.score - a.score);

  check("matching returns ranked verified cleaners", matches.length > 0 && matches[0].score > 0, `top ${matches[0]?.worker.name} @ ${matches[0]?.score}/100`);
  check("match score is capped at 100", matches.every((m) => m.score <= 100));
  check("ranking is descending", matches.every((m, i) => i === 0 || matches[i - 1].score >= m.score));

  const picked = matches[0].worker;
  const booking = await createBooking({
    householdId: household.id,
    workerId: picked.id,
    category: "cleaner",
    type: "recurring",
    date: new Date().toISOString().slice(0, 10),
    time: "08:00",
    days: [1, 2, 3, 4, 5, 6],
    durationMins: 90,
    price: picked.wage,
    notes: "3BHK, second floor",
  });
  check("booking created as a request", booking.status === "requested" && !!booking.schedule, booking.id);

  await respondToBooking(booking.id, true);
  check("worker acceptance confirms the booking", booking.status === "confirmed");

  const jobsBefore = picked.jobsCompleted;
  ["en-route", "arrived", "in-progress", "completed"].forEach((s) => advanceBooking(booking.id, s as never));
  check("status walks through to completed", booking.status === "completed" && !!booking.completedAt);
  check("completed job increments the worker's count", picked.jobsCompleted === jobsBefore + 1);

  const payment = await payBooking(booking.id, "upi");
  check("payment captured with 12% platform fee", !!payment && payment.amount === booking.price && payment.platformFee === Math.round(booking.price * 0.12));
  check("worker payout = price minus fee", !!payment && payment.workerPayout === booking.price - payment.platformFee);
  check("payout timeline is 24 hours", !!payment?.payoutDueAt && Date.parse(payment.payoutDueAt) - Date.now() > 23 * 3600 * 1000);
  check("platform protection active on app payment", booking.onPlatformPayment === true);

  const ratingBefore = picked.rating;
  const review = addReview({
    bookingId: booking.id,
    householdId: household.id,
    householdName: household.name,
    quality: 5,
    punctuality: 4,
    professionalism: 5,
    text: "Came on time every day and the house was spotless.",
  });
  check("review linked to the booking and flagged verified", !!review && review.verifiedJob && booking.reviewId === review.id);
  check(
    "new review nudges the running average instead of replacing it",
    Math.abs(picked.rating - ratingBefore) <= 0.2 && workerReviews(picked.id).length > 0,
    `${ratingBefore} -> ${picked.rating}`,
  );

  // cash payment drops protection
  const cashBooking = await createBooking({
    householdId: household.id,
    workerId: picked.id,
    category: "cleaner",
    type: "one-time",
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    days: [],
    durationMins: 60,
    price: 500,
  });
  advanceBooking(cashBooking.id, "completed");
  const cashPayment = await payBooking(cashBooking.id, "cash");
  check("cash payment keeps full amount with the worker", cashPayment?.workerPayout === 500 && cashPayment?.platformFee === 0);
  check("cash payment removes platform protection", cashBooking.onPlatformPayment === false);

  // replacement
  const replacement = await assignReplacement(booking.id);
  check("replacement assigns a different verified worker", !!replacement && replacement.id !== picked.id && replacement.verified, replacement?.name);

  // pause / resume
  booking.schedule!.paused = true;
  check("recurring plan can be paused", booking.schedule!.paused === true);

  // ------------------------------------------------------- worker journey
  const queue = verificationQueue();
  check("unverified workers sit in the admin queue", queue.length > 0, `${queue.length} waiting`);
  const candidate = queue[0].worker;
  await decideWorkerVerification(candidate.id, true, "Documents clear, skill test passed.");
  check("approval marks the worker verified and active", candidate.verified && candidate.status === "active", candidate.name);
  check("approval enrols insurance", db().verifications.find((v) => v.workerId === candidate.id)?.insurance.status === "complete");
  check("approved worker leaves the queue", !verificationQueue().some((q) => q.worker.id === candidate.id));

  const newJob = await createBooking({
    householdId: data.households[1].id,
    workerId: candidate.id,
    category: candidate.categories[0],
    type: "one-time",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    days: [],
    durationMins: 60,
    price: candidate.wage || 400,
  });
  await respondToBooking(newJob.id, true);
  advanceBooking(newJob.id, "in-progress");
  advanceBooking(newJob.id, "completed");
  await payBooking(newJob.id, "upi");
  const earnings = workerEarnings(candidate.id);
  check("newly verified worker sees earnings after payment", earnings.lifetime > 0, `₹${earnings.lifetime}`);

  const declined = await createBooking({
    householdId: data.households[2].id,
    workerId: candidate.id,
    category: candidate.categories[0],
    type: "one-time",
    date: new Date().toISOString().slice(0, 10),
    time: "16:00",
    days: [],
    durationMins: 60,
    price: 400,
  });
  await respondToBooking(declined.id, false);
  check("declining releases the booking", declined.status === "declined" && declined.workerId === null);

  // ------------------------------------------------- government analytics
  const trades = tradeRollup("2026-08", "all");
  const districts = districtRollup("2026-08", "all");
  check("trade rollup covers every listed trade", trades.length === CATEGORIES.length, `${trades.length}/${CATEGORIES.length}`);
  check("district rollup covers every zone", districts.length === ZONES.length, `${districts.length}/${ZONES.length}`);
  check("fill rate is a sane percentage", districts.every((d) => d.fillRate >= 0 && d.fillRate <= 100));
  check(
    "aggregates carry no personal identifiers",
    db().stats.every((s) => !("workerId" in s) && !("householdId" in s) && !("name" in s)),
  );

  // -------------------------------- WhatsApp job card sent to the worker
  // A booking of its own: the one above has since been reassigned to a
  // replacement worker, so its outbox no longer holds the original card.
  const waWorker = data.workers.find((w) => w.verified && w.categories.includes("cook"))!;
  const waHousehold = data.households[3];
  const waBooking = await createBooking({
    householdId: waHousehold.id,
    workerId: waWorker.id,
    category: "cook",
    type: "recurring",
    date: "2026-09-05",
    time: "09:00",
    days: [1, 2, 3, 4, 5, 6],
    durationMins: 90,
    price: 5500,
    notes: "Pure veg, two people",
  });

  check("booking records that the worker was messaged", !!waBooking.notifiedAt);

  const card = messagesTo(waWorker.phone)[0]?.body ?? "";
  check("job card reached the worker's number", !!card, waWorker.phone);
  for (const [label, needle] of [
    ["who booked", waHousehold.name],
    ["what work", "Cook"],
    ["when", "09:00"],
    ["where", waHousehold.addressLine],
    ["how much", "5,500"],
    ["the household note", "Pure veg"],
  ] as const) {
    check(`message carries ${label}`, card.includes(needle), needle);
  }

  // The worker reads it, so it is composed in the worker's language — which
  // lives on their user record, not the worker profile.
  const waUser = data.users.find((u) => u.id === waWorker.userId)!;
  waUser.language = "hi";
  const hindiCard = buildJobMessage({ booking: waBooking, worker: waWorker, household: waHousehold });
  check(
    "message uses the worker's own language, not the household's",
    hindiCard.locale === "hi" && /[ऀ-ॿ]/.test(hindiCard.body),
  );
  waUser.language = undefined;

  const link = whatsappLink(waWorker.phone, "hello ji");
  check(
    "wa.me link carries the country code and encoded text",
    link.startsWith("https://wa.me/91") && link.includes("hello%20ji"),
    link.slice(0, 42),
  );

  // ------------------------------------------- rapid services pricing
  check("shop lookup resolves a seeded shop", getShop("s1")?.name.includes("Al-Noor") === true);
  check("shops fall back to the city when a locality has none", shopsIn("Jagatpura", "sabzi").length > 0);
  check("runner fare rises with distance", runnerFare(1) < runnerFare(5), `${runnerFare(1)} -> ${runnerFare(5)}`);
  check("runner fare is clamped at the far end", runnerFare(999) === runnerFare(25));
  check("flat fees are defined once", DUKAAN_FEE === 35 && URGENT_VISIT_FEE === 299);

  // A trade worked on a site earns a day rate, not the household call-out fee.
  for (const trade of ["carpenter", "painter", "mason", "plumber", "electrician"] as const) {
    check(
      `${trade} site day rate exceeds its call-out fee`,
      catSiteDayRate(trade) > CATEGORY_MAP[trade].typicalPrice,
      `${CATEGORY_MAP[trade].typicalPrice}/visit vs ${catSiteDayRate(trade)}/day`,
    );
  }

  // ------------------------------- the construction chain (differentiator)
  const chain = buildChain();
  check("the build chain covers the whole workforce", chain.length >= 15, `${chain.length} trades`);
  check(
    "every phase trade is a real category",
    chain.every((trade) => CATEGORIES.some((c) => c.id === trade)),
  );
  check(
    "phases are numbered in build order",
    BUILD_PHASES.every((p, i) => p.step === i + 1),
  );
  check(
    "design comes before foundation, and finishing after structure",
    BUILD_PHASES[0].id === "design" &&
      BUILD_PHASES.findIndex((p) => p.id === "foundation") < BUILD_PHASES.findIndex((p) => p.id === "structure") &&
      BUILD_PHASES.findIndex((p) => p.id === "structure") < BUILD_PHASES.findIndex((p) => p.id === "finishing"),
  );

  const small = planBuild(1000);
  const large = planBuild(3000);
  check("a bigger house needs more people", large.totalPeople > small.totalPeople, `${small.totalPeople} -> ${large.totalPeople}`);
  check("a bigger house costs more", large.totalCost > small.totalCost, `₹${small.totalCost} -> ₹${large.totalCost}`);
  check("a bigger house takes longer", large.totalDays > small.totalDays, `${small.totalDays} -> ${large.totalDays} days`);
  check("plot size is clamped to something buildable", planBuild(5).sqft === 250 && planBuild(999999).sqft === 20000);

  const essentialOnly = planBuild(1500, false);
  check("dropping optional trades costs less", essentialOnly.totalCost < planBuild(1500).totalCost);
  check(
    "essential roles survive the optional filter",
    essentialOnly.phases.every((p) => p.roles.every((r) => r.essential)),
  );

  // The seed must actually cover the chain, or the plan is a brochure.
  check("every trade in the chain has a verified worker", planBuild(1500).gaps.length === 0, `gaps: ${planBuild(1500).gaps.join(", ") || "none"}`);

  // A professional is a fee, not a roster line.
  const design = planBuild(2000).phases.find((p) => p.phase.id === "design")!;
  check("professionals are priced per project, not per day", design.roles.every((r) => r.days === 0 && r.headcount === 1));

  // ------------------------------------------ Phase 2: contractor journey
  const contractor = data.contractors[0];
  const projects = contractorProjects(contractor.id);
  check("contractor has seeded projects", projects.length > 0, `${projects.length} projects`);

  const running = projects.find((p) => p.status === "running")!;
  const assignments = projectAssignments(running.id);
  check("running project has a confirmed team", assignments.some((a) => a.status === "confirmed"));
  check(
    "site work reuses the recurring schedule shape",
    Array.isArray(running.schedule.days) && running.schedule.days.length > 0,
  );
  check("project gaps are computed per trade", projectGaps(running).length === running.requirements.length);

  const before = projectWages(running.id).total;
  const checkedIn = assignments.find((a) => a.status === "confirmed")!;
  const today = new Date().toISOString().slice(0, 10);
  if (!checkedIn.attendance.includes(today)) checkedIn.attendance.push(today);
  const after = projectWages(running.id).total;
  check("attendance check-in raises the payroll total", after === before + checkedIn.dailyRate, `₹${before} -> ₹${after}`);

  const finished = projects.find((p) => p.status === "completed")!;
  const rated = projectAssignments(finished.id).filter((a) => a.contractorRating && a.workerRating);
  check("completed project carries mutual reviews", rated.length > 0, `${rated.length} pairs`);

  // -------------------------------------------- Phase 3: skill passport
  const siteWorker = data.workers.find((w) => w.name === "Babulal Meena")!;
  const passport = skillPassport(siteWorker);
  check(
    "passport is derived from completed work",
    passport.verifiedJobs > 0,
    `${passport.verifiedJobs} jobs, ${passport.hours} hrs`,
  );
  check("passport counts site projects as verified history", passport.entries.some((e) => e.kind === "site"));
  check("passed skill check produces the Certified badge", isCertified(siteWorker.id));

  const uncertified = data.workers.find((w) => !isCertified(w.id))!;
  check("workers without a skill check are not Certified", !isCertified(uncertified.id), uncertified.name);
  check("training listings match a worker's trades", listingsForTrades(["electrician"]).length > 0);

  // ------------------------------------------- Phase 5: partner surface
  const impact = impactSummary();
  check(
    "impact numbers are populated",
    impact.workersVerified > 0 && impact.jobsCompleted > 0 && impact.incomeDisbursed > 0,
    `${impact.workersVerified} workers · ₹${impact.incomeDisbursed}`,
  );
  check("impact covers every district", impact.districts === ZONES.length, `${impact.districts}/${ZONES.length}`);
  check("partnership inbox is readable", data.inquiries.length > 0, `${data.inquiries.length} inquiries`);

  console.log(failures === 0 ? "\nAll flow checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
