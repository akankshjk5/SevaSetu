import type { CategoryId, ServiceCategory } from "./types";

/**
 * The full trade taxonomy: household help, skilled trades, machinery operators
 * and the professionals who lead a build.
 *
 * Names and blurbs here are English fallbacks only — screens render
 * `t("cat.<id>")` so every category label is translated. Prices and icons are
 * language-independent and live with the data.
 *
 * `tier` decides how a category is presented and priced. A professional is
 * engaged for a project, a trade by the day or the visit, an operator arrives
 * with a machine, support is general labour.
 */
export const CATEGORIES: ServiceCategory[] = [
  // ---------------------------------------------------------- household ---
  { id: "cleaner", name: "House cleaning", icon: "🧹", kind: "recurring", domain: "household", tier: "household", blurb: "Sweeping, mopping, dusting, bathrooms", typicalPrice: 3500, priceUnit: "per month" },
  { id: "cook", name: "Cook", icon: "🍲", kind: "recurring", domain: "household", tier: "household", blurb: "Daily meals, roti-sabzi, veg or non-veg", typicalPrice: 5500, priceUnit: "per month" },
  { id: "house-helper", name: "House helper", icon: "🏠", kind: "recurring", domain: "household", tier: "household", blurb: "All-round help: cleaning, utensils, laundry", typicalPrice: 6000, priceUnit: "per month" },
  { id: "gardener", name: "Gardener", icon: "🌿", kind: "recurring", domain: "household", tier: "household", blurb: "Watering, pruning, lawn and pot care", typicalPrice: 2500, priceUnit: "per month" },
  { id: "mover", name: "Mover / packer", icon: "📦", kind: "oneoff", domain: "household", tier: "support", blurb: "Shifting, packing, loading help", typicalPrice: 1800, priceUnit: "per visit" },

  // ------------------------------------------- trades serving both worlds --
  { id: "plumber", name: "Plumber", icon: "🔧", kind: "oneoff", domain: "both", tier: "trade", blurb: "Leaks, taps, drainage, pipe fittings", typicalPrice: 450, priceUnit: "per visit", siteDailyRate: 800 },
  { id: "electrician", name: "Electrician", icon: "⚡", kind: "oneoff", domain: "both", tier: "trade", blurb: "Wiring, switches, fans, AC & appliances", typicalPrice: 500, priceUnit: "per visit", siteDailyRate: 850 },
  { id: "carpenter", name: "Carpenter", icon: "🪚", kind: "oneoff", domain: "both", tier: "trade", blurb: "Locks, hinges, furniture, modular repair", typicalPrice: 450, priceUnit: "per visit", siteDailyRate: 900 },
  { id: "painter", name: "Painter", icon: "🎨", kind: "oneoff", domain: "both", tier: "trade", blurb: "Wall touch-ups, putty, primer, paint", typicalPrice: 500, priceUnit: "per visit", siteDailyRate: 750 },
  { id: "mason", name: "Mason", icon: "🧱", kind: "oneoff", domain: "both", tier: "trade", blurb: "Plaster, brickwork, concrete", typicalPrice: 650, priceUnit: "per visit", siteDailyRate: 850 },
  { id: "tile-worker", name: "Tile worker", icon: "🪟", kind: "oneoff", domain: "both", tier: "trade", blurb: "Floor and wall tiles, marble, grouting", typicalPrice: 700, priceUnit: "per visit", siteDailyRate: 900 },
  { id: "welder", name: "Welder / fabricator", icon: "🔥", kind: "oneoff", domain: "both", tier: "trade", blurb: "Grills, gates, railings, steel fabrication", typicalPrice: 800, priceUnit: "per visit", siteDailyRate: 950 },
  { id: "ac-technician", name: "AC & appliance technician", icon: "❄️", kind: "oneoff", domain: "both", tier: "trade", blurb: "AC service, fridge, washing machine repair", typicalPrice: 550, priceUnit: "per visit", siteDailyRate: 900 },
  { id: "interior", name: "Interior & renovation", icon: "🛋️", kind: "oneoff", domain: "both", tier: "professional", blurb: "False ceiling, modular kitchen, renovation", typicalPrice: 45000, priceUnit: "per project" },
  { id: "landscaper", name: "Landscaping", icon: "🌳", kind: "oneoff", domain: "both", tier: "trade", blurb: "Lawns, garden design, planting, upkeep", typicalPrice: 3500, priceUnit: "per visit", siteDailyRate: 800 },

  // ------------------------------------------------------- site trades ----
  { id: "bar-bender", name: "Bar bender", icon: "🔩", kind: "site", domain: "site", tier: "trade", blurb: "Steel cutting, bending, tying", typicalPrice: 800, priceUnit: "per day" },
  { id: "helper", name: "Site helper", icon: "👷", kind: "site", domain: "site", tier: "support", blurb: "General site labour & mixing", typicalPrice: 550, priceUnit: "per day" },

  // ---------------------------------------- machinery: operator + machine --
  { id: "jcb-operator", name: "JCB / excavator operator", icon: "🚜", kind: "site", domain: "site", tier: "operator", blurb: "Digging, levelling, trenching — machine included", typicalPrice: 4500, priceUnit: "per day" },
  { id: "crane-operator", name: "Crane / hydra operator", icon: "🏗️", kind: "site", domain: "site", tier: "operator", blurb: "Lifting and placing heavy material", typicalPrice: 6000, priceUnit: "per day" },
  { id: "transport", name: "Transport & material delivery", icon: "🚚", kind: "oneoff", domain: "both", tier: "operator", blurb: "Sand, cement, steel and debris haulage", typicalPrice: 2200, priceUnit: "per visit", siteDailyRate: 3500 },

  // --------------------------------------------------- professionals -----
  { id: "contractor-civil", name: "Civil contractor", icon: "🏘️", kind: "site", domain: "site", tier: "professional", blurb: "Takes the whole build — labour, material, schedule", typicalPrice: 250000, priceUnit: "per project" },
  { id: "supervisor", name: "Site supervisor", icon: "📋", kind: "site", domain: "site", tier: "professional", blurb: "Daily site control, attendance, quality checks", typicalPrice: 1500, priceUnit: "per day" },
  { id: "civil-engineer", name: "Civil engineer", icon: "🧰", kind: "site", domain: "site", tier: "professional", blurb: "Structure, estimates, quality and safety sign-off", typicalPrice: 60000, priceUnit: "per project" },
  { id: "architect", name: "Architect", icon: "📐", kind: "site", domain: "site", tier: "professional", blurb: "Drawings, approvals, elevation and layout", typicalPrice: 90000, priceUnit: "per project" },
  { id: "surveyor", name: "Surveyor", icon: "🧭", kind: "site", domain: "site", tier: "professional", blurb: "Plot marking, levels, boundary verification", typicalPrice: 12000, priceUnit: "per project" },
];

export const HOUSEHOLD_CATEGORIES = CATEGORIES.filter((c) => c.domain === "household" || c.domain === "both");
export const SITE_CATEGORIES = CATEGORIES.filter((c) => c.domain === "site" || c.domain === "both");

/** The professionals and operators that distinguish this from a home-repair app. */
export const PROFESSIONAL_CATEGORIES = CATEGORIES.filter((c) => c.tier === "professional");
export const OPERATOR_CATEGORIES = CATEGORIES.filter((c) => c.tier === "operator");

export const CATEGORY_MAP: Record<CategoryId, ServiceCategory> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, ServiceCategory>;

export function categoryName(id: CategoryId) {
  return CATEGORY_MAP[id]?.name ?? id;
}

/** Translation keys for a category's label, blurb and price unit. */
export function categoryKey(id: CategoryId) {
  return `cat.${id}`;
}
export function categoryBlurbKey(id: CategoryId) {
  return `cat.${id}.blurb`;
}
export function priceUnitKey(unit: ServiceCategory["priceUnit"]) {
  if (unit === "per month") return "common.perMonth";
  if (unit === "per day") return "common.perDay";
  if (unit === "per project") return "common.perProject";
  return "common.perVisit";
}

/**
 * What a day of this trade costs on a site. Trades that also serve homes carry
 * an explicit day rate; site-only trades price by the day already. Professionals
 * quoted per project have no day rate — they are engaged, not rostered.
 */
export function siteDayRate(id: CategoryId): number {
  const cat = CATEGORY_MAP[id];
  return cat.siteDailyRate ?? cat.typicalPrice;
}
