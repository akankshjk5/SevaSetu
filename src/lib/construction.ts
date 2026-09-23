import { CATEGORY_MAP, siteDayRate } from "./categories";
import { db } from "./store";
import type { CategoryId, WorkerProfile } from "./types";

/**
 * A house build, as a sequence rather than a search box.
 *
 * The difference this platform is claiming is that someone building a house
 * should not have to find an architect, then separately a contractor, then a
 * mason, then an electrician. The order of the work is knowledge the customer
 * does not have and the platform does — so it is encoded here, and the chain
 * is walked for them.
 *
 * Each phase names the trades it needs and roughly how many, so a plot size can
 * be turned into a real shortlist and a budget rather than a brochure.
 */

export type BuildPhaseId =
  | "design"
  | "approvals"
  | "foundation"
  | "structure"
  | "walls"
  | "services"
  | "finishing"
  | "handover";

export type PhaseRole = {
  trade: CategoryId;
  /** Headcount per 1000 sq ft of built-up area, rounded up to at least one. */
  perThousandSqft: number;
  /** Days this role is typically engaged per 1000 sq ft. */
  daysPerThousandSqft: number;
  /** Without this role the phase cannot start. */
  essential: boolean;
};

export type BuildPhase = {
  id: BuildPhaseId;
  /** Order in the chain — this is the knowledge the customer is missing. */
  step: number;
  icon: string;
  roles: PhaseRole[];
};

export const BUILD_PHASES: BuildPhase[] = [
  {
    id: "design",
    step: 1,
    icon: "📐",
    roles: [
      { trade: "architect", perThousandSqft: 0, daysPerThousandSqft: 0, essential: true },
      { trade: "surveyor", perThousandSqft: 0, daysPerThousandSqft: 0, essential: true },
    ],
  },
  {
    id: "approvals",
    step: 2,
    icon: "🧰",
    roles: [{ trade: "civil-engineer", perThousandSqft: 0, daysPerThousandSqft: 0, essential: true }],
  },
  {
    id: "foundation",
    step: 3,
    icon: "🚜",
    roles: [
      { trade: "contractor-civil", perThousandSqft: 0, daysPerThousandSqft: 0, essential: true },
      { trade: "jcb-operator", perThousandSqft: 0, daysPerThousandSqft: 2, essential: true },
      { trade: "mason", perThousandSqft: 2, daysPerThousandSqft: 12, essential: true },
      { trade: "helper", perThousandSqft: 3, daysPerThousandSqft: 12, essential: true },
    ],
  },
  {
    id: "structure",
    step: 4,
    icon: "🏗️",
    roles: [
      { trade: "bar-bender", perThousandSqft: 2, daysPerThousandSqft: 18, essential: true },
      { trade: "mason", perThousandSqft: 3, daysPerThousandSqft: 25, essential: true },
      { trade: "crane-operator", perThousandSqft: 0, daysPerThousandSqft: 3, essential: false },
      { trade: "supervisor", perThousandSqft: 1, daysPerThousandSqft: 25, essential: true },
      { trade: "helper", perThousandSqft: 4, daysPerThousandSqft: 25, essential: true },
    ],
  },
  {
    id: "walls",
    step: 5,
    icon: "🧱",
    roles: [
      { trade: "mason", perThousandSqft: 3, daysPerThousandSqft: 20, essential: true },
      { trade: "transport", perThousandSqft: 0, daysPerThousandSqft: 4, essential: true },
      { trade: "helper", perThousandSqft: 3, daysPerThousandSqft: 20, essential: true },
    ],
  },
  {
    id: "services",
    step: 6,
    icon: "🔧",
    roles: [
      { trade: "electrician", perThousandSqft: 2, daysPerThousandSqft: 14, essential: true },
      { trade: "plumber", perThousandSqft: 2, daysPerThousandSqft: 12, essential: true },
      { trade: "welder", perThousandSqft: 1, daysPerThousandSqft: 6, essential: false },
    ],
  },
  {
    id: "finishing",
    step: 7,
    icon: "🎨",
    roles: [
      { trade: "tile-worker", perThousandSqft: 2, daysPerThousandSqft: 15, essential: true },
      { trade: "carpenter", perThousandSqft: 2, daysPerThousandSqft: 18, essential: true },
      { trade: "painter", perThousandSqft: 2, daysPerThousandSqft: 14, essential: true },
      { trade: "interior", perThousandSqft: 0, daysPerThousandSqft: 0, essential: false },
    ],
  },
  {
    id: "handover",
    step: 8,
    icon: "🔑",
    roles: [
      { trade: "ac-technician", perThousandSqft: 1, daysPerThousandSqft: 2, essential: false },
      { trade: "landscaper", perThousandSqft: 1, daysPerThousandSqft: 4, essential: false },
      { trade: "cleaner", perThousandSqft: 2, daysPerThousandSqft: 3, essential: true },
    ],
  },
];

export type PlannedRole = {
  trade: CategoryId;
  headcount: number;
  days: number;
  /** Day-rated roles: headcount × days × rate. Project-rated: the fee once. */
  cost: number;
  essential: boolean;
  /** Verified workers on the platform who can take this on, right now. */
  available: number;
};

export type PlannedPhase = {
  phase: BuildPhase;
  roles: PlannedRole[];
  cost: number;
  /** Longest role in the phase — phases run their roles in parallel. */
  days: number;
};

export type BuildPlan = {
  sqft: number;
  phases: PlannedPhase[];
  totalCost: number;
  /** Phases run one after another, so the build duration is their sum. */
  totalDays: number;
  totalPeople: number;
  /** Roles the platform currently has nobody verified for. */
  gaps: CategoryId[];
};

function availableFor(trade: CategoryId, workers: WorkerProfile[]): number {
  return workers.filter((w) => w.verified && w.status === "active" && w.categories.includes(trade)).length;
}

/**
 * Turns a plot size into the whole workforce, in order, with a cost and a
 * duration — the thing a person building a house actually wants to know.
 */
export function planBuild(sqft: number, includeOptional = true): BuildPlan {
  const area = Math.max(250, Math.min(20000, Math.round(sqft)));
  const units = area / 1000;
  const workers = db().workers;

  const phases: PlannedPhase[] = BUILD_PHASES.map((phase) => {
    const roles: PlannedRole[] = phase.roles
      .filter((r) => includeOptional || r.essential)
      .map((r) => {
        const cat = CATEGORY_MAP[r.trade];
        const projectPriced = cat.priceUnit === "per project";

        // A professional engaged for the build is a fee, not a roster line.
        const headcount = projectPriced ? 1 : Math.max(1, Math.ceil(r.perThousandSqft * units));
        const days = projectPriced ? 0 : Math.max(1, Math.round(r.daysPerThousandSqft * units));
        const cost = projectPriced
          ? Math.round(cat.typicalPrice * Math.max(1, units))
          : headcount * days * siteDayRate(r.trade);

        return { trade: r.trade, headcount, days, cost, essential: r.essential, available: availableFor(r.trade, workers) };
      });

    return {
      phase,
      roles,
      cost: roles.reduce((sum, r) => sum + r.cost, 0),
      days: roles.reduce((max, r) => Math.max(max, r.days), 0),
    };
  });

  const gaps = [...new Set(phases.flatMap((p) => p.roles.filter((r) => r.available === 0).map((r) => r.trade)))];

  return {
    sqft: area,
    phases,
    totalCost: phases.reduce((sum, p) => sum + p.cost, 0),
    totalDays: phases.reduce((sum, p) => sum + p.days, 0),
    totalPeople: phases.reduce((sum, p) => sum + p.roles.reduce((n, r) => n + r.headcount, 0), 0),
    gaps,
  };
}

/** Every trade a full build touches, in the order it is needed. */
export function buildChain(): CategoryId[] {
  const seen = new Set<CategoryId>();
  for (const phase of BUILD_PHASES) {
    for (const role of phase.roles) seen.add(role.trade);
  }
  return [...seen];
}
