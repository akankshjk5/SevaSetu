import type { CategoryId, ServiceCategory } from "./types";

/**
 * Names and blurbs here are English fallbacks only — screens render
 * `t("cat.<id>")` so every category label is translated. Prices and icons are
 * language-independent and live with the data.
 */
export const CATEGORIES: ServiceCategory[] = [
  { id: "cleaner", name: "House cleaning", icon: "🧹", kind: "recurring", domain: "household", blurb: "Sweeping, mopping, dusting, bathrooms", typicalPrice: 3500, priceUnit: "per month" },
  { id: "cook", name: "Cook", icon: "🍲", kind: "recurring", domain: "household", blurb: "Daily meals, roti-sabzi, veg or non-veg", typicalPrice: 5500, priceUnit: "per month" },
  { id: "house-helper", name: "House helper", icon: "🏠", kind: "recurring", domain: "household", blurb: "All-round help: cleaning, utensils, laundry", typicalPrice: 6000, priceUnit: "per month" },
  { id: "gardener", name: "Gardener", icon: "🌿", kind: "recurring", domain: "household", blurb: "Watering, pruning, lawn and pot care", typicalPrice: 2500, priceUnit: "per month" },
  { id: "plumber", name: "Plumber", icon: "🔧", kind: "oneoff", domain: "both", blurb: "Leaks, taps, drainage, pipe fittings", typicalPrice: 450, priceUnit: "per visit" },
  { id: "electrician", name: "Electrician", icon: "⚡", kind: "oneoff", domain: "both", blurb: "Wiring, switches, fans, AC & appliances", typicalPrice: 500, priceUnit: "per visit" },
  { id: "carpenter", name: "Carpenter", icon: "🪚", kind: "oneoff", domain: "both", blurb: "Locks, hinges, furniture, modular repair", typicalPrice: 450, priceUnit: "per visit" },
  { id: "painter", name: "Painter", icon: "🎨", kind: "oneoff", domain: "both", blurb: "Wall touch-ups, putty, primer, paint", typicalPrice: 500, priceUnit: "per visit" },
  { id: "mason", name: "Mason", icon: "🧱", kind: "oneoff", domain: "both", blurb: "Tile repair, plaster, brickwork, concrete", typicalPrice: 650, priceUnit: "per visit" },
  { id: "mover", name: "Mover / packer", icon: "📦", kind: "oneoff", domain: "household", blurb: "Shifting, packing, loading help", typicalPrice: 1800, priceUnit: "per visit" },

  // Phase 2 site trades
  { id: "bar-bender", name: "Bar bender", icon: "🔩", kind: "site", domain: "site", blurb: "Steel cutting, bending, tying", typicalPrice: 800, priceUnit: "per day" },
  { id: "helper", name: "Site helper", icon: "👷", kind: "site", domain: "site", blurb: "General site labour & mixing", typicalPrice: 550, priceUnit: "per day" },
];

export const HOUSEHOLD_CATEGORIES = CATEGORIES.filter((c) => c.domain === "household" || c.domain === "both");
export const SITE_CATEGORIES = CATEGORIES.filter((c) => c.domain === "site" || c.domain === "both");

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
  return unit === "per month" ? "common.perMonth" : unit === "per day" ? "common.perDay" : "common.perVisit";
}
