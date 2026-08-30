import { ZONES } from "./seed";
import type {
  Certification,
  ContractorProfile,
  PartnershipInquiry,
  Project,
  ProjectAssignment,
  SkillAssessment,
  TrainingListing,
  TrainingProviderProfile,
  User,
  WorkerProfile,
} from "./types";

/**
 * Phase 2 to 5 demo data, kept in its own file so the Phase 1 seed stays the
 * readable core of the prototype.
 */

const zone = (n: string) => ZONES.find((z) => z.name === n) ?? ZONES[0];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function dateOffset(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export type PhaseData = {
  contractors: ContractorProfile[];
  projects: Project[];
  assignments: ProjectAssignment[];
  providers: TrainingProviderProfile[];
  listings: TrainingListing[];
  assessments: SkillAssessment[];
  certifications: Certification[];
  inquiries: PartnershipInquiry[];
};

export function buildPhaseData(users: User[], workers: WorkerProfile[]): PhaseData {
  // ---------------------------------------------------------- contractors
  const contractors: ContractorProfile[] = [
    {
      id: "c1",
      userId: "u_c1",
      companyName: "Shree Balaji Constructions",
      contactName: "Mahendra Jangid",
      phone: "9829011221",
      gst: "08AABCS1429B1ZP",
      district: "Jagatpura",
      location: zone("Jagatpura"),
      about: "Residential builder working on 2 to 6 floor projects across east Jaipur since 2011.",
      rating: 4.4,
      ratingCount: 38,
      projectsCompleted: 22,
    },
    {
      id: "c2",
      userId: "u_c2",
      companyName: "Marudhar Infra",
      contactName: "Sanjay Choudhary",
      phone: "9829044556",
      gst: "08AACFM8821C1ZK",
      district: "Mansarovar",
      location: zone("Mansarovar"),
      about: "Interior fit-out and renovation contracts for housing societies.",
      rating: 4.2,
      ratingCount: 19,
      projectsCompleted: 11,
    },
  ];

  users.push(
    { id: "u_c1", role: "contractor", name: "Mahendra Jangid", phone: "9829011221", createdAt: daysAgo(320) },
    { id: "u_c2", role: "contractor", name: "Sanjay Choudhary", phone: "9829044556", createdAt: daysAgo(210) },
  );

  const workerBy = (name: string) => workers.find((w) => w.name === name);

  // -------------------------------------------------------------- projects
  const projects: Project[] = [
    {
      id: "p1",
      contractorId: "c1",
      name: "Ganesh Vihar — B block finishing",
      siteAddress: "Plot 22, Ganesh Vihar, Jagatpura",
      district: "Jagatpura",
      location: zone("Jagatpura"),
      startDate: dateOffset(-12),
      durationDays: 45,
      hoursFrom: "08:00",
      hoursTo: "18:00",
      requirements: [
        { trade: "mason", count: 2, dailyRate: 900 },
        { trade: "painter", count: 1, dailyRate: 780 },
        { trade: "helper", count: 2, dailyRate: 580 },
      ],
      status: "running",
      createdAt: daysAgo(20),
      schedule: { days: [1, 2, 3, 4, 5, 6], time: "08:00", paused: false, startedAt: daysAgo(12) },
    },
    {
      id: "p2",
      contractorId: "c2",
      name: "Sunrise Society — lobby renovation",
      siteAddress: "Sunrise Apartments, Madhyam Marg, Mansarovar",
      district: "Mansarovar",
      location: zone("Mansarovar"),
      startDate: dateOffset(4),
      durationDays: 18,
      hoursFrom: "09:00",
      hoursTo: "18:00",
      requirements: [
        { trade: "carpenter", count: 2, dailyRate: 950 },
        { trade: "painter", count: 1, dailyRate: 800 },
      ],
      status: "hiring",
      createdAt: daysAgo(2),
      schedule: { days: [1, 2, 3, 4, 5, 6], time: "09:00", paused: false, startedAt: dateOffset(4) },
    },
    {
      id: "p3",
      contractorId: "c1",
      name: "Shanti Enclave — column and slab work",
      siteAddress: "Shanti Enclave, Jagatpura",
      district: "Jagatpura",
      location: zone("Jagatpura"),
      startDate: dateOffset(-120),
      durationDays: 60,
      hoursFrom: "07:00",
      hoursTo: "17:00",
      requirements: [
        { trade: "bar-bender", count: 2, dailyRate: 850 },
        { trade: "mason", count: 2, dailyRate: 880 },
        { trade: "helper", count: 3, dailyRate: 560 },
      ],
      status: "completed",
      createdAt: daysAgo(130),
      completedAt: daysAgo(58),
      schedule: { days: [1, 2, 3, 4, 5, 6], time: "07:00", paused: false, startedAt: daysAgo(120) },
    },
  ];

  // ----------------------------------------------------------- assignments
  const assignments: ProjectAssignment[] = [];
  let seq = 0;
  const add = (
    projectId: string,
    workerName: string,
    trade: ProjectAssignment["trade"],
    dailyRate: number,
    status: ProjectAssignment["status"],
    attendanceDays: number,
    ratings?: { contractorRating?: number; contractorReview?: string; workerRating?: number; workerReview?: string },
  ) => {
    const w = workerBy(workerName);
    if (!w) return;
    assignments.push({
      id: `pa_${++seq}`,
      projectId,
      workerId: w.id,
      trade,
      dailyRate,
      status,
      createdAt: daysAgo(25),
      attendance: Array.from({ length: attendanceDays }, (_, i) => dateOffset(-(attendanceDays - i))),
      paidDays: attendanceDays,
      ...ratings,
    });
  };

  // Running project — team confirmed, attendance building up.
  add("p1", "Babulal Meena", "mason", 900, "confirmed", 10);
  add("p1", "Ismail Qureshi", "mason", 900, "confirmed", 9);
  add("p1", "Mukesh Bairwa", "painter", 780, "confirmed", 6);
  add("p1", "Kailash Regar", "helper", 580, "confirmed", 10);
  add("p1", "Pappu Meena", "helper", 580, "requested", 0);

  // Hiring project — shortlist waiting for the contractor to send requests.
  add("p2", "Ravi Sharma", "carpenter", 950, "shortlisted", 0);
  add("p2", "Jitendra Nagar", "carpenter", 950, "shortlisted", 0);
  add("p2", "Mukesh Bairwa", "painter", 800, "shortlisted", 0);

  // Completed project — mutual reviews, feeds the skill passport.
  add("p3", "Sohan Lal", "bar-bender", 850, "completed", 48, {
    contractorRating: 5,
    contractorReview: "Never missed a day. Steel work was exactly as per drawing.",
    workerRating: 4,
    workerReview: "Payment came on time every week. Site had drinking water and shade.",
  });
  add("p3", "Babulal Meena", "mason", 880, "completed", 52, {
    contractorRating: 5,
    contractorReview: "Handled the slab work and guided the helpers well.",
    workerRating: 5,
    workerReview: "Good contractor. Clear instructions, no delay in wages.",
  });
  add("p3", "Kailash Regar", "helper", 560, "completed", 45, {
    contractorRating: 4,
    contractorReview: "Hard working, needs some supervision on measurements.",
    workerRating: 4,
    workerReview: "Regular work for two months. Would go again.",
  });

  // ------------------------------------------------- training providers ---
  const providers: TrainingProviderProfile[] = [
    {
      id: "tp1",
      userId: "u_tp1",
      orgName: "Jaipur Skill Centre",
      contactName: "Dr. Meera Saxena",
      phone: "9829077881",
      district: "Mansarovar",
      about: "NSDC-affiliated training centre running short-duration trade courses for informal workers.",
    },
  ];
  users.push({ id: "u_tp1", role: "training", name: "Dr. Meera Saxena", phone: "9829077881", createdAt: daysAgo(150) });

  const listings: TrainingListing[] = [
    {
      id: "tl1",
      providerId: "tp1",
      providerName: "Jaipur Skill Centre",
      title: "Domestic wiring and safety",
      trade: "electrician",
      district: "Mansarovar",
      durationDays: 21,
      fee: 0,
      seats: 30,
      about: "Household wiring, MCB and earthing, safe practice. Government funded — no fee for enrolled workers.",
      createdAt: daysAgo(40),
    },
    {
      id: "tl2",
      providerId: "tp1",
      providerName: "Jaipur Skill Centre",
      title: "Plumbing — fittings and leak repair",
      trade: "plumber",
      district: "Jagatpura",
      durationDays: 14,
      fee: 1500,
      seats: 25,
      about: "Tap and pipeline fitting, tank cleaning, common leak repairs with hands-on practice.",
      createdAt: daysAgo(28),
    },
    {
      id: "tl3",
      providerId: "tp1",
      providerName: "Jaipur Skill Centre",
      title: "Professional home cooking and kitchen hygiene",
      trade: "cook",
      district: "Malviya Nagar",
      durationDays: 10,
      fee: 800,
      seats: 20,
      about: "Menu planning for families, food safety, kitchen hygiene and time management.",
      createdAt: daysAgo(15),
    },
    {
      id: "tl4",
      providerId: "tp1",
      providerName: "Jaipur Skill Centre",
      title: "Bar bending and steel reading",
      trade: "bar-bender",
      district: "Jagatpura",
      durationDays: 12,
      fee: 0,
      seats: 24,
      about: "Reading bar bending schedules, cutting, bending and tying to drawing.",
      createdAt: daysAgo(9),
    },
  ];

  // ------------------------------------------------------- skill passport --
  const assessments: SkillAssessment[] = [];
  const certifications: Certification[] = [];
  let aseq = 0;

  const passed = (name: string, trade: SkillAssessment["trade"], score: number, ago: number) => {
    const w = workerBy(name);
    if (!w) return;
    assessments.push({
      id: `sa_${++aseq}`,
      workerId: w.id,
      trade,
      mode: "quiz",
      status: "passed",
      score,
      takenAt: daysAgo(ago),
    });
  };
  const practical = (name: string, trade: SkillAssessment["trade"], status: SkillAssessment["status"], ago: number) => {
    const w = workerBy(name);
    if (!w) return;
    assessments.push({
      id: `sa_${++aseq}`,
      workerId: w.id,
      trade,
      mode: "practical",
      status,
      centre: "Jaipur Skill Centre, Mansarovar",
      scheduledFor: status === "scheduled" ? dateOffset(3) : undefined,
      takenAt: status === "scheduled" ? undefined : daysAgo(ago),
      score: status === "passed" ? 82 : undefined,
    });
  };

  passed("Sunita Devi", "cleaner", 88, 200);
  passed("Kamla Sharma", "cook", 92, 240);
  passed("Hemlata Verma", "cleaner", 90, 160);
  passed("Anita Gurjar", "cook", 78, 120);
  passed("Babulal Meena", "mason", 85, 90);
  passed("Ravi Sharma", "carpenter", 81, 70);
  practical("Ramesh Meena", "plumber", "passed", 150);
  practical("Mahesh Kumawat", "electrician", "passed", 180);
  practical("Bhanwar Singh", "plumber", "scheduled", 0);

  const cert = (name: string, certName: string, issuer: string, year: number, verified: boolean) => {
    const w = workerBy(name);
    if (!w) return;
    certifications.push({
      id: `cert_${certifications.length + 1}`,
      workerId: w.id,
      name: certName,
      issuer,
      year,
      verified,
      createdAt: daysAgo(100),
    });
  };
  cert("Mahesh Kumawat", "ITI — Electrician", "ITI Jaipur", 2012, true);
  cert("Ramesh Meena", "Plumbing (Level 3)", "Skill India / NSDC", 2019, true);
  cert("Kamla Sharma", "Food safety and hygiene", "Jaipur Skill Centre", 2023, true);
  cert("Babulal Meena", "Mason — general", "Skill India / NSDC", 2021, false);

  // ------------------------------------------------------ Phase 5 inbox ---
  const inquiries: PartnershipInquiry[] = [
    {
      id: "pi_1",
      name: "R. Venkatesh",
      department: "Department of Skill Development, Entrepreneurship & Livelihoods",
      state: "Karnataka",
      email: "venkatesh.r@example.gov.in",
      message:
        "Interested in the district-level skill-gap signal for household trades. Can you share the methodology note and a sample report for two districts?",
      createdAt: daysAgo(6),
      status: "new",
    },
    {
      id: "pi_2",
      name: "Sunita Rathi",
      department: "Rajasthan Skill and Livelihoods Development Corporation",
      state: "Rajasthan",
      email: "sunita.rathi@example.gov.in",
      message: "We run domestic-help batches in Jaipur. Would like to discuss placement linkage for trained candidates.",
      createdAt: daysAgo(2),
      status: "contacted",
    },
  ];

  return { contractors, projects, assignments, providers, listings, assessments, certifications, inquiries };
}
