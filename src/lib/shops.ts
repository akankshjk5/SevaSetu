import type { CategoryId } from "./types";

/**
 * Local shops and the pricing for the rapid-services hub.
 *
 * This lives in the data layer, not inside the component, for two reasons: the
 * server needs to look a shop up when an order is placed, and the fare has to
 * be computed somewhere the browser cannot edit. A price that only exists in
 * client state is a price the customer can set themselves.
 */

export type ShopCategory = "chicken" | "medicine" | "kirana" | "hardware" | "sabzi";

export type LocalShop = {
  id: string;
  name: string;
  category: ShopCategory;
  locality: string;
  distanceKm: number;
  etaMins: number;
  highlight: string;
  verifiedShop: boolean;
};

export const LOCAL_SHOPS: LocalShop[] = [
  // Malviya Nagar
  { id: "s1", name: "Al-Noor Fresh Poultry & Meat", category: "chicken", locality: "Malviya Nagar", distanceKm: 0.8, etaMins: 14, highlight: "Fresh daily cut, washed & hygienically packed", verifiedShop: true },
  { id: "s2", name: "Sharma Medicos & 24/7 Chemist", category: "medicine", locality: "Malviya Nagar", distanceKm: 0.4, etaMins: 10, highlight: "All prescription medicines & baby care in stock", verifiedShop: true },
  { id: "s3", name: "Goyal Kirana & Provision Store", category: "kirana", locality: "Malviya Nagar", distanceKm: 0.3, etaMins: 11, highlight: "Fresh chakki atta, pulses, dairy & spices", verifiedShop: true },
  { id: "s4", name: "Jaipur Hardware & Sanitary Mart", category: "hardware", locality: "Malviya Nagar", distanceKm: 0.6, etaMins: 13, highlight: "Taps, pipes, MCB, wires & adhesives", verifiedShop: true },
  { id: "s5", name: "Sector 4 Fresh Sabzi Mandi Cart", category: "sabzi", locality: "Malviya Nagar", distanceKm: 0.2, etaMins: 9, highlight: "Farm fresh vegetables & seasonal fruits", verifiedShop: true },

  // Mansarovar
  { id: "s6", name: "Rawat Fresh Chicken Center", category: "chicken", locality: "Mansarovar", distanceKm: 1.1, etaMins: 16, highlight: "Curry cut, boneless & fresh eggs", verifiedShop: true },
  { id: "s7", name: "Sanjeevani Healthcare Pharmacy", category: "medicine", locality: "Mansarovar", distanceKm: 0.5, etaMins: 11, highlight: "Genuine medicines, glucose & emergency supplies", verifiedShop: true },
  { id: "s8", name: "Aggarwal Brothers Super Store", category: "kirana", locality: "Mansarovar", distanceKm: 0.4, etaMins: 12, highlight: "Wholesale colony grocery rates", verifiedShop: true },
  { id: "s9", name: "Shree Ram Electricals & Hardware", category: "hardware", locality: "Mansarovar", distanceKm: 0.7, etaMins: 15, highlight: "Fan capacitors, LED lights, plumbing fittings", verifiedShop: true },

  // Vaishali Nagar
  { id: "s10", name: "Delight Fresh Chicken & Eggs", category: "chicken", locality: "Vaishali Nagar", distanceKm: 0.9, etaMins: 15, highlight: "Cleaned and vacuum packed cuts", verifiedShop: true },
  { id: "s11", name: "Apex Chemist & Surgical", category: "medicine", locality: "Vaishali Nagar", distanceKm: 0.6, etaMins: 12, highlight: "Full prescription inventory & first-aid", verifiedShop: true },
  { id: "s12", name: "Kanha Daily Essentials & Dairy", category: "kirana", locality: "Vaishali Nagar", distanceKm: 0.5, etaMins: 12, highlight: "Organic flours, dry fruits & fresh milk", verifiedShop: true },

  // C-Scheme
  { id: "s13", name: "Ashok Nagar Fresh Poultry", category: "chicken", locality: "C-Scheme", distanceKm: 1.0, etaMins: 15, highlight: "Daily fresh chicken & mutton", verifiedShop: true },
  { id: "s14", name: "Jaipur Central Drug Store", category: "medicine", locality: "C-Scheme", distanceKm: 0.3, etaMins: 9, highlight: "Emergency injections, oxygen & medicines", verifiedShop: true },
  { id: "s15", name: "Kothari General Merchant", category: "kirana", locality: "C-Scheme", distanceKm: 0.4, etaMins: 11, highlight: "Gourmet spices, premium rice & oil", verifiedShop: true },
];

export function getShop(id: string): LocalShop | null {
  return LOCAL_SHOPS.find((s) => s.id === id) ?? null;
}

export function shopsIn(locality: string, category: ShopCategory): LocalShop[] {
  const local = LOCAL_SHOPS.filter((s) => s.locality === locality && s.category === category);
  return local.length ? local : LOCAL_SHOPS.filter((s) => s.category === category);
}

// ------------------------------------------------------------- pricing ----

/** Flat hyperlocal delivery fee, paid in full to the rider. */
export const DUKAAN_FEE = 35;
/** Errand runner: a base fare plus distance. */
export const RUNNER_BASE = 35;
export const RUNNER_PER_KM = 10;
/** Urgent trade call-out: inspection plus minor fixes. */
export const URGENT_VISIT_FEE = 299;

export function runnerFare(distanceKm: number): number {
  const km = Math.min(25, Math.max(1, Math.round(distanceKm)));
  return RUNNER_BASE + km * RUNNER_PER_KM;
}

export function runnerEtaMins(distanceKm: number): number {
  const km = Math.min(25, Math.max(1, Math.round(distanceKm)));
  return 8 + km * 2;
}

export const URGENT_TRADES = ["plumber", "electrician", "carpenter"] as const;
export type UrgentTrade = (typeof URGENT_TRADES)[number];

export function urgentEtaMins(trade: UrgentTrade): number {
  return trade === "plumber" ? 14 : trade === "electrician" ? 12 : 18;
}

export function isUrgentTrade(value: string): value is UrgentTrade {
  return (URGENT_TRADES as readonly string[]).includes(value);
}

/** The trade a rapid order maps to in the main booking model. */
export function tradeForOrder(kind: "dukaan" | "runner" | "minutes", urgent?: UrgentTrade): CategoryId {
  if (kind === "minutes" && urgent) return urgent;
  return "mover";
}
