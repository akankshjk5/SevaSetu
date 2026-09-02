import { CATEGORY_MAP, siteDayRate } from "./categories";
import { buildPhaseData } from "./seed-phases";
import type {
  AggregatedStat,
  Certification,
  ContractorProfile,
  PartnershipInquiry,
  Project,
  RapidOrder,
  ProjectAssignment,
  SkillAssessment,
  TrainingListing,
  TrainingProviderProfile,
  Booking,
  CategoryId,
  Dispute,
  HouseholdProfile,
  Payment,
  Review,
  User,
  VerificationRecord,
  WorkerProfile,
} from "./types";

export const CITY = "Jaipur";

export const ZONES = [
  { name: "Malviya Nagar", lat: 26.8505, lng: 75.8055 },
  { name: "Vaishali Nagar", lat: 26.9124, lng: 75.7373 },
  { name: "Mansarovar", lat: 26.8505, lng: 75.7628 },
  { name: "C-Scheme", lat: 26.9057, lng: 75.7973 },
  { name: "Jagatpura", lat: 26.8129, lng: 75.8503 },
  { name: "Vidhyadhar Nagar", lat: 26.9506, lng: 75.7756 },
];

const zone = (n: string) => ZONES.find((z) => z.name === n)!;
const jitter = (v: number, i: number) => v + ((i % 7) - 3) * 0.0045;

type WorkerSeed = {
  name: string;
  locality: string;
  cats: CategoryId[];
  exp: number;
  langs: string[];
  wage: number;
  rating: number;
  jobs: number;
  days: number[];
  from: string;
  to: string;
  bio: string;
  verified: boolean;
};

const WORKER_SEEDS: WorkerSeed[] = [
  { name: "Sunita Devi", locality: "Malviya Nagar", cats: ["cleaner", "house-helper"], exp: 8, langs: ["Hindi", "Marwari"], wage: 4200, rating: 4.8, jobs: 214, days: [1, 2, 3, 4, 5, 6], from: "07:00", to: "13:00", bio: "Eight years of daily cleaning work in Malviya Nagar flats. I finish on time and keep bathrooms spotless.", verified: true },
  { name: "Kamla Sharma", locality: "Malviya Nagar", cats: ["cook"], exp: 12, langs: ["Hindi", "Rajasthani"], wage: 6500, rating: 4.9, jobs: 340, days: [1, 2, 3, 4, 5, 6, 0], from: "06:30", to: "11:00", bio: "Pure vegetarian Rajasthani and North Indian cooking. Dal-baati, sabzi, roti made fresh with less oil.", verified: true },
  { name: "Ramesh Meena", locality: "Jagatpura", cats: ["plumber"], exp: 10, langs: ["Hindi"], wage: 500, rating: 4.7, jobs: 486, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "20:00", bio: "Leaks, motor fitting, drainage blockage. I carry my own tools and give a 15-day work guarantee.", verified: true },
  { name: "Pooja Yadav", locality: "Mansarovar", cats: ["cleaner"], exp: 4, langs: ["Hindi"], wage: 3200, rating: 4.6, jobs: 118, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "14:00", bio: "Cleaning work for 2BHK and 3BHK homes. Careful with marble floors and glass.", verified: true },
  { name: "Mahesh Kumawat", locality: "Vaishali Nagar", cats: ["electrician"], exp: 14, langs: ["Hindi", "English"], wage: 550, rating: 4.8, jobs: 612, days: [1, 2, 3, 4, 5, 6, 0], from: "08:00", to: "21:00", bio: "ITI certified. Wiring, MCB, inverter, fan and geyser repair. Same-day visit in Vaishali Nagar.", verified: true },
  { name: "Lakshmi Bai", locality: "C-Scheme", cats: ["house-helper", "cleaner"], exp: 6, langs: ["Hindi", "Marwari"], wage: 6800, rating: 4.5, jobs: 156, days: [1, 2, 3, 4, 5, 6], from: "07:30", to: "12:30", bio: "Full house help including utensils, laundry and cleaning. Working with C-Scheme families since 2020.", verified: true },
  { name: "Girdhari Lal", locality: "Vidhyadhar Nagar", cats: ["gardener"], exp: 20, langs: ["Hindi", "Rajasthani"], wage: 2800, rating: 4.9, jobs: 271, days: [2, 4, 6], from: "06:00", to: "10:00", bio: "Twenty years of garden and lawn work. Seasonal plants, pruning, pest treatment.", verified: true },
  { name: "Anita Gurjar", locality: "Mansarovar", cats: ["cook", "house-helper"], exp: 7, langs: ["Hindi"], wage: 5800, rating: 4.7, jobs: 189, days: [1, 2, 3, 4, 5, 6], from: "17:00", to: "21:00", bio: "Evening cooking for working families. Simple home food, tiffin packing also.", verified: true },
  { name: "Vijay Saini", locality: "Jagatpura", cats: ["electrician", "plumber"], exp: 9, langs: ["Hindi"], wage: 480, rating: 4.4, jobs: 302, days: [1, 2, 3, 4, 5, 6], from: "09:00", to: "19:00", bio: "Electrical and small plumbing jobs. Honest pricing, no extra parts charge without telling you first.", verified: true },
  { name: "Shabnam Khan", locality: "Vaishali Nagar", cats: ["cleaner"], exp: 5, langs: ["Hindi", "Urdu"], wage: 3600, rating: 4.6, jobs: 143, days: [1, 2, 3, 4, 5, 6], from: "09:00", to: "15:00", bio: "Deep cleaning and daily cleaning. I can also do utensils if needed.", verified: true },
  { name: "Rekha Jangid", locality: "Malviya Nagar", cats: ["cook"], exp: 3, langs: ["Hindi"], wage: 4800, rating: 4.3, jobs: 64, days: [1, 2, 3, 4, 5], from: "07:00", to: "10:00", bio: "Morning cook. Breakfast, lunch prep, tiffin. Veg only.", verified: true },
  { name: "Suresh Bairwa", locality: "Mansarovar", cats: ["mover"], exp: 6, langs: ["Hindi"], wage: 1900, rating: 4.5, jobs: 97, days: [1, 2, 3, 4, 5, 6, 0], from: "07:00", to: "20:00", bio: "Shifting and packing with two helpers. Careful with fridge, TV and glass items.", verified: true },
  { name: "Hemlata Verma", locality: "C-Scheme", cats: ["cleaner", "house-helper"], exp: 11, langs: ["Hindi", "English"], wage: 7200, rating: 4.9, jobs: 388, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "13:00", bio: "Experienced with large bungalows. Can manage other staff and keys when the family travels.", verified: true },
  { name: "Bhanwar Singh", locality: "Vidhyadhar Nagar", cats: ["plumber"], exp: 16, langs: ["Hindi"], wage: 520, rating: 4.6, jobs: 421, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "19:00", bio: "Bathroom fitting, tank cleaning, RO and pipeline work.", verified: true },
  { name: "Sarita Meena", locality: "Jagatpura", cats: ["cook", "cleaner"], exp: 2, langs: ["Hindi"], wage: 4500, rating: 4.2, jobs: 38, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "12:00", bio: "New to the platform but two years of home cooking experience in Jagatpura.", verified: true },
  { name: "Om Prakash", locality: "Vaishali Nagar", cats: ["gardener"], exp: 13, langs: ["Hindi"], wage: 3000, rating: 4.7, jobs: 176, days: [1, 3, 5], from: "06:00", to: "10:00", bio: "Lawn maintenance and terrace gardens. I bring my own cutter.", verified: true },
  { name: "Nasreen Bano", locality: "Malviya Nagar", cats: ["house-helper"], exp: 4, langs: ["Hindi", "Urdu"], wage: 5600, rating: 4.4, jobs: 88, days: [1, 2, 3, 4, 5, 6], from: "10:00", to: "16:00", bio: "Cleaning, utensils, laundry, small kitchen help. Comfortable with pets.", verified: true },
  { name: "Dinesh Kumhar", locality: "Mansarovar", cats: ["electrician"], exp: 7, langs: ["Hindi"], wage: 460, rating: 4.3, jobs: 154, days: [1, 2, 3, 4, 5, 6], from: "10:00", to: "20:00", bio: "Fan, light, switchboard and inverter work. Evening slots available.", verified: true },
  { name: "Manju Devi", locality: "Jagatpura", cats: ["cleaner"], exp: 3, langs: ["Hindi"], wage: 3000, rating: 0, jobs: 0, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "14:00", bio: "Looking for daily cleaning work near Jagatpura.", verified: false },
  { name: "Rakesh Prajapat", locality: "Vidhyadhar Nagar", cats: ["plumber", "mover"], exp: 5, langs: ["Hindi"], wage: 470, rating: 0, jobs: 0, days: [1, 2, 3, 4, 5, 6], from: "09:00", to: "19:00", bio: "Plumbing and shifting work. Have own loading rickshaw for small loads.", verified: false },
  { name: "Priya Sharma", locality: "C-Scheme", cats: ["cook"], exp: 6, langs: ["Hindi", "English"], wage: 6200, rating: 0, jobs: 0, days: [1, 2, 3, 4, 5, 6], from: "06:00", to: "11:00", bio: "Continental and Indian cooking, worked in a cafe kitchen for three years.", verified: false },

  // Phase 2 site trades — the same worker pool, different trades.
  { name: "Babulal Meena", locality: "Jagatpura", cats: ["mason"], exp: 18, langs: ["Hindi"], wage: 900, rating: 4.7, jobs: 96, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "18:00", bio: "Brick, plaster and RCC work. Have led teams of six on residential sites.", verified: true },
  { name: "Ismail Qureshi", locality: "Vidhyadhar Nagar", cats: ["mason", "helper"], exp: 11, langs: ["Hindi", "Urdu"], wage: 850, rating: 4.5, jobs: 74, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "18:00", bio: "Plaster and tile fixing. Reach the site on time, every day.", verified: true },
  { name: "Ravi Sharma", locality: "Mansarovar", cats: ["carpenter"], exp: 14, langs: ["Hindi"], wage: 950, rating: 4.8, jobs: 112, days: [1, 2, 3, 4, 5, 6], from: "09:00", to: "19:00", bio: "Shuttering, door and window fitting, modular work.", verified: true },
  { name: "Jitendra Nagar", locality: "Vaishali Nagar", cats: ["carpenter", "helper"], exp: 6, langs: ["Hindi"], wage: 800, rating: 4.3, jobs: 41, days: [1, 2, 3, 4, 5, 6], from: "09:00", to: "18:00", bio: "Shuttering and general carpentry on residential sites.", verified: true },
  { name: "Mukesh Bairwa", locality: "Malviya Nagar", cats: ["painter"], exp: 9, langs: ["Hindi"], wage: 780, rating: 4.6, jobs: 88, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "18:00", bio: "Putty, primer, emulsion and texture work. Neat finishing.", verified: true },
  { name: "Sohan Lal", locality: "Jagatpura", cats: ["bar-bender"], exp: 12, langs: ["Hindi"], wage: 850, rating: 4.5, jobs: 67, days: [1, 2, 3, 4, 5, 6], from: "07:00", to: "17:00", bio: "Steel cutting, bending and tying as per drawings.", verified: true },
  { name: "Kailash Regar", locality: "Mansarovar", cats: ["helper"], exp: 4, langs: ["Hindi"], wage: 580, rating: 4.2, jobs: 53, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "18:00", bio: "Site helper — mixing, loading, cleaning. Hard working.", verified: true },
  { name: "Pappu Meena", locality: "Vidhyadhar Nagar", cats: ["helper", "painter"], exp: 3, langs: ["Hindi"], wage: 560, rating: 4.1, jobs: 29, days: [1, 2, 3, 4, 5, 6], from: "08:00", to: "18:00", bio: "General site work and painting support.", verified: true },
];

type HouseholdSeed = { name: string; locality: string; address: string };

const HOUSEHOLD_SEEDS: HouseholdSeed[] = [
  { name: "Ankit Agarwal", locality: "Malviya Nagar", address: "B-142, Sector 4, Malviya Nagar" },
  { name: "Neha Bhandari", locality: "Vaishali Nagar", address: "Flat 302, Shanti Residency, Vaishali Nagar" },
  { name: "Rohit Chaturvedi", locality: "Mansarovar", address: "78, Madhyam Marg, Mansarovar" },
  { name: "Sneha Rathore", locality: "C-Scheme", address: "12, Ashok Marg, C-Scheme" },
  { name: "Vikram Choudhary", locality: "Jagatpura", address: "A-9, Green Valley, Jagatpura" },
  { name: "Deepa Nair", locality: "Vidhyadhar Nagar", address: "C-55, Sector 2, Vidhyadhar Nagar" },
];

const REVIEW_TEXTS = [
  "Very sincere worker. Comes on time every morning and never takes leave without informing.",
  "Cleaning quality is good, bathrooms are properly done. Happy so far.",
  "Food is tasty and she keeps the kitchen clean after cooking. Highly recommend.",
  "Fixed the leakage in 20 minutes and did not overcharge for parts.",
  "Polite and quick. Explained what was wrong with the wiring before starting.",
  "Good work overall, sometimes 10-15 minutes late but always informs on WhatsApp.",
  "We booked for one month and have now extended. Very reliable.",
  "Handled the shifting carefully, nothing broke. Team was helpful.",
  "Garden looks much better after two visits. Knows plants well.",
  "Does the work properly without being told again and again.",
  "Satisfied. The verification badge gave us confidence to hand over house keys.",
  "Cooking is good but portion planning took a week to settle in.",
];

let counter = 1000;
const id = (p: string) => `${p}_${++counter}`;

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function dateAhead(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export type SeedData = {
  users: User[];
  workers: WorkerProfile[];
  households: HouseholdProfile[];
  verifications: VerificationRecord[];
  bookings: Booking[];
  payments: Payment[];
  reviews: Review[];
  disputes: Dispute[];
  stats: AggregatedStat[];
  // Phase 2 to 5
  contractors: ContractorProfile[];
  projects: Project[];
  assignments: ProjectAssignment[];
  providers: TrainingProviderProfile[];
  listings: TrainingListing[];
  assessments: SkillAssessment[];
  certifications: Certification[];
  inquiries: PartnershipInquiry[];
  rapidOrders: RapidOrder[];
};

export function buildSeed(): SeedData {
  counter = 1000;
  const users: User[] = [];
  const workers: WorkerProfile[] = [];
  const households: HouseholdProfile[] = [];
  const verifications: VerificationRecord[] = [];
  const bookings: Booking[] = [];
  const payments: Payment[] = [];
  const reviews: Review[] = [];
  const disputes: Dispute[] = [];

  WORKER_SEEDS.forEach((w, i) => {
    const z = zone(w.locality);
    const uid = `u_w${i + 1}`;
    const wid = `w${i + 1}`;
    const phone = `9${(800000000 + i * 137711).toString().slice(0, 9)}`;
    users.push({ id: uid, role: "worker", name: w.name, phone, createdAt: daysAgo(400 - i * 12) });
    workers.push({
      id: wid,
      userId: uid,
      name: w.name,
      photo: ["w1", "w2", "w3", "w4", "w22"].includes(wid) ? `/workers/${wid}.jpg` : "",
      phone,
      locality: w.locality,
      district: w.locality,
      location: { lat: jitter(z.lat, i), lng: jitter(z.lng, i + 3) },
      categories: w.cats,
      experienceYears: w.exp,
      languages: w.langs,
      wage: w.wage,
      bio: w.bio,
      rating: w.rating,
      ratingCount: w.rating ? Math.max(1, Math.round(w.jobs * 0.6)) : 0,
      jobsCompleted: w.jobs,
      availableDays: w.days,
      availableFrom: w.from,
      availableTo: w.to,
      verified: w.verified,
      status: w.verified ? "active" : "onboarding",
      joinedAt: daysAgo(400 - i * 12),
    });
    verifications.push(
      w.verified
        ? {
            workerId: wid,
            govId: { status: "complete", docType: "Aadhaar", docNumberMasked: `XXXX XXXX ${4000 + i}`, submittedAt: daysAgo(390 - i * 12) },
            policeCheck: { status: "complete", submittedAt: daysAgo(388 - i * 12), clearedAt: daysAgo(381 - i * 12) },
            skillCheck: { status: "complete", assessor: "Jaipur Skill Centre", score: 70 + ((i * 7) % 25), clearedAt: daysAgo(379 - i * 12) },
            insurance: { status: "complete", policyNo: `POL-JP-${23100 + i}`, cover: 200000 },
            submittedAt: daysAgo(390 - i * 12),
            decidedAt: daysAgo(379 - i * 12),
          }
        : {
            workerId: wid,
            govId: { status: "pending", docType: "Aadhaar", docNumberMasked: `XXXX XXXX ${5100 + i}`, submittedAt: daysAgo(Math.max(1, 21 - i)) },
            policeCheck: { status: i === 19 ? "pending" : "not-started" },
            skillCheck: { status: "not-started" },
            insurance: { status: "not-started" },
            submittedAt: daysAgo(Math.max(1, 21 - i)),
          },
    );
  });

  HOUSEHOLD_SEEDS.forEach((h, i) => {
    const z = zone(h.locality);
    const uid = `u_h${i + 1}`;
    const hid = `h${i + 1}`;
    const phone = `9${(700000000 + i * 424243).toString().slice(0, 9)}`;
    users.push({ id: uid, role: "household", name: h.name, phone, createdAt: daysAgo(300 - i * 20) });
    households.push({
      id: hid,
      userId: uid,
      name: h.name,
      phone,
      addressLine: h.address,
      locality: h.locality,
      district: h.locality,
      location: { lat: jitter(z.lat, i + 1), lng: jitter(z.lng, i) },
      savedLocations: [{ label: "Home", addressLine: h.address, location: { lat: jitter(z.lat, i + 1), lng: jitter(z.lng, i) } }],
    });
  });

  users.push({ id: "u_admin", role: "admin", name: "Ops — Priyanka Jain", phone: "9000000001", createdAt: daysAgo(500) });
  users.push({ id: "u_gov", role: "government", name: "Skill Mission — District Office", phone: "9000000002", createdAt: daysAgo(500) });

  // ---- historical bookings, payments and reviews -------------------------
  let r = 7;
  const rnd = () => ((r = (r * 1103515245 + 12345) % 2147483648) / 2147483648);

  // Household booking history only covers household-domain workers; site
  // trades get their project history in `seed-phases.ts`.
  const verifiedWorkers = workers.filter(
    (w) => w.verified && w.categories.some((c) => CATEGORY_MAP[c].domain === "household"),
  );
  for (let i = 0; i < 90; i++) {
    const w = verifiedWorkers[Math.floor(rnd() * verifiedWorkers.length)];
    const h = households[Math.floor(rnd() * households.length)];
    const householdCats = w.categories.filter((c) => CATEGORY_MAP[c].domain === "household");
    const cat = householdCats[Math.floor(rnd() * householdCats.length)];
    const oneoff = CATEGORY_MAP[cat].kind === "oneoff";
    const type: Booking["type"] = oneoff ? "one-time" : rnd() > 0.4 ? "recurring" : "weekly";
    const ago = 1 + Math.floor(rnd() * 120);
    const bid = id("bk");
    const price = oneoff ? w.wage + Math.floor(rnd() * 4) * 50 : w.wage;
    const onPlatform = rnd() > 0.12;
    const b: Booking = {
      id: bid,
      householdId: h.id,
      workerId: w.id,
      category: cat,
      type,
      status: "completed",
      addressLine: h.addressLine,
      locality: h.locality,
      district: h.district,
      location: h.location,
      date: daysAgo(ago).slice(0, 10),
      time: w.availableFrom,
      durationMins: oneoff ? 60 : 90,
      price,
      createdAt: daysAgo(ago + 1),
      completedAt: daysAgo(ago),
      onPlatformPayment: onPlatform,
      schedule: oneoff ? undefined : { days: w.availableDays.slice(0, 5), time: w.availableFrom, paused: false, startedAt: daysAgo(ago + 30) },
    };
    bookings.push(b);

    const fee = Math.round(price * 0.12);
    const pid = id("pay");
    payments.push({
      id: pid,
      bookingId: bid,
      amount: price,
      platformFee: fee,
      workerPayout: price - fee,
      method: onPlatform ? (rnd() > 0.4 ? "upi" : "card") : "cash",
      status: onPlatform ? "released" : "paid",
      paidAt: b.completedAt,
      payoutDueAt: daysAgo(Math.max(0, ago - 1)),
      reference: `TXN${100000 + i}`,
    });
    b.paymentId = pid;

    if (rnd() > 0.35) {
      const rid = id("rv");
      const q = 3 + Math.round(rnd() * 2);
      const p = 3 + Math.round(rnd() * 2);
      const pr = 3 + Math.round(rnd() * 2);
      reviews.push({
        id: rid,
        bookingId: bid,
        workerId: w.id,
        householdId: h.id,
        householdName: h.name,
        quality: q,
        punctuality: p,
        professionalism: pr,
        rating: Math.round(((q + p + pr) / 3) * 10) / 10,
        text: REVIEW_TEXTS[Math.floor(rnd() * REVIEW_TEXTS.length)],
        verifiedJob: true,
        createdAt: b.completedAt!,
        status: "published",
      });
      b.reviewId = rid;
    }
  }

  // A couple of flagged reviews for the moderation queue
  reviews[3] = { ...reviews[3], status: "flagged", text: "Worker asked us to pay outside the app and shared a personal number. Also spoke rudely." };
  reviews[9] = { ...reviews[9], status: "flagged", text: "Fake review — this household never booked us, they are a competitor agency." };

  // ---- live bookings for the demo household (h1) -------------------------
  const home = households[0];
  const live: Booking[] = [
    {
      id: "bk_live_1",
      householdId: "h1",
      workerId: "w1",
      category: "cleaner",
      type: "recurring",
      status: "in-progress",
      addressLine: home.addressLine,
      locality: "Malviya Nagar",
      district: "Malviya Nagar",
      location: home.location,
      date: new Date().toISOString().slice(0, 10),
      time: "07:00",
      durationMins: 90,
      price: 4200,
      createdAt: daysAgo(45),
      onPlatformPayment: true,
      schedule: { days: [1, 2, 3, 4, 5, 6], time: "07:00", paused: false, startedAt: daysAgo(45) },
      notes: "2BHK, please do the balcony twice a week.",
    },
    {
      id: "bk_live_2",
      householdId: "h1",
      workerId: "w2",
      category: "cook",
      type: "recurring",
      status: "confirmed",
      addressLine: home.addressLine,
      locality: "Malviya Nagar",
      district: "Malviya Nagar",
      location: home.location,
      date: dateAhead(1),
      time: "06:30",
      durationMins: 90,
      price: 6500,
      createdAt: daysAgo(120),
      onPlatformPayment: true,
      schedule: { days: [1, 2, 3, 4, 5, 6, 0], time: "06:30", paused: false, startedAt: daysAgo(120) },
      notes: "Pure veg. Two people, lunch and dinner prep.",
    },
    {
      id: "bk_live_3",
      householdId: "h1",
      workerId: "w3",
      category: "plumber",
      type: "one-time",
      status: "completed",
      addressLine: home.addressLine,
      locality: "Malviya Nagar",
      district: "Malviya Nagar",
      location: home.location,
      date: daysAgo(2).slice(0, 10),
      time: "11:00",
      durationMins: 60,
      price: 550,
      createdAt: daysAgo(3),
      completedAt: daysAgo(2),
      onPlatformPayment: true,
      notes: "Kitchen sink blocked.",
      paymentId: "pay_live_3",
    },
  ];
  live.forEach((b) => bookings.push(b));
  payments.push({
    id: "pay_live_3",
    bookingId: "bk_live_3",
    amount: 550,
    platformFee: 66,
    workerPayout: 484,
    method: "upi",
    status: "released",
    paidAt: daysAgo(2),
    payoutDueAt: daysAgo(1),
    reference: "TXN200001",
  });

  // ---- an open job request waiting for the demo worker (w1) --------------
  bookings.push({
    id: "bk_req_1",
    householdId: "h4",
    workerId: "w1",
    category: "cleaner",
    type: "weekly",
    status: "requested",
    addressLine: households[3].addressLine,
    locality: "C-Scheme",
    district: "C-Scheme",
    location: households[3].location,
    date: dateAhead(2),
    time: "09:00",
    durationMins: 120,
    price: 3800,
    createdAt: daysAgo(0),
    onPlatformPayment: true,
    notes: "3BHK, weekly deep clean on Saturdays.",
  });

  // ---- disputes ----------------------------------------------------------
  const disputedBooking = bookings.find((b) => b.status === "completed" && b.workerId === "w9") ?? bookings[0];
  disputes.push({
    id: "dp_1",
    bookingId: disputedBooking.id,
    raisedBy: "household",
    raisedByName: "Rohit Chaturvedi",
    reason: "Work not completed",
    detail: "Electrician left after 15 minutes saying the part was not available, but the full visit charge was taken.",
    status: "open",
    notes: [{ at: daysAgo(2), by: "System", text: "Payment of ₹480 held pending resolution." }],
    createdAt: daysAgo(2),
  });
  disputes.push({
    id: "dp_2",
    bookingId: bookings[5].id,
    raisedBy: "worker",
    raisedByName: "Pooja Yadav",
    reason: "Payment not received",
    detail: "Household marked the job complete but chose cash and did not pay the full amount.",
    status: "open",
    notes: [],
    createdAt: daysAgo(1),
  });
  disputes.push({
    id: "dp_3",
    bookingId: bookings[8].id,
    raisedBy: "household",
    raisedByName: "Neha Bhandari",
    reason: "Worker did not turn up",
    detail: "Cook did not come for two days without informing.",
    status: "resolved",
    notes: [{ at: daysAgo(9), by: "Ops — Priyanka Jain", text: "Spoke to both sides. Worker had a medical emergency." }],
    resolution: "Replacement worker assigned within 24 hours, two days refunded to the household.",
    createdAt: daysAgo(10),
    resolvedAt: daysAgo(9),
  });

  const phases = buildPhaseData(users, workers);

  return {
    users,
    workers,
    households,
    verifications,
    bookings,
    payments,
    reviews,
    disputes,
    stats: buildStats(workers),
    rapidOrders: [],
    ...phases,
  };
}

function buildStats(workers: WorkerProfile[]): AggregatedStat[] {
  const trades: CategoryId[] = [
    "cleaner",
    "cook",
    "house-helper",
    "gardener",
    "plumber",
    "electrician",
    "mover",
    "mason",
    "carpenter",
    "painter",
    "bar-bender",
    "helper",
  ];
  const periods = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
  const out: AggregatedStat[] = [];
  let s = 13;
  const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);

  for (const z of ZONES) {
    for (const trade of trades) {
      const supplyBase = workers.filter((w) => w.district === z.name && w.categories.includes(trade)).length;
      periods.forEach((period, pi) => {
        const supply = Math.max(3, supplyBase * 6 + Math.round(rnd() * 8) + pi);
        const demand = Math.round(supply * (0.8 + rnd() * 1.4));
        const filled = Math.round(Math.min(demand, supply) * (0.62 + rnd() * 0.33));
        const gap = Math.max(0, demand - supply) / Math.max(1, demand);
        const cat = CATEGORY_MAP[trade];
        const oneoff = cat.kind === "oneoff";
        // Trades that also work sites earn at the day rate there, so their
        // average income must not be read off the call-out price alone.
        const site = cat.kind === "site" || cat.domain === "both";
        out.push({
          district: z.name,
          trade,
          period,
          demand,
          supply,
          verifiedWorkers: Math.round(supply * 0.78),
          filled,
          avgWage: site
            ? siteDayRate(trade) + Math.round(rnd() * 150)
            : oneoff
              ? 450 + Math.round(rnd() * 200)
              : 3000 + Math.round(rnd() * 3500),
          trainingDemandSignal: Math.round(gap * 100),
        });
      });
    }
  }
  return out;
}
