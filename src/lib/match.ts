import type { CategoryId, LatLng, WorkerProfile } from "./types";

export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export type MatchInput = {
  category: CategoryId;
  location: LatLng;
  /** 0-6, the days the household needs help */
  days: number[];
  time: string;
  budget?: number;
};

export type MatchBreakdown = {
  skill: number;
  distance: number;
  rating: number;
  price: number;
  availability: number;
};

export type MatchedWorker = {
  worker: WorkerProfile;
  distanceKm: number;
  score: number;
  breakdown: MatchBreakdown;
  /** Translation keys + vars, so the reasons render in the user's language. */
  reasons: { key: string; vars?: Record<string, string | number> }[];
};

const toMins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/**
 * Transparent 100-point match score. The household sees this number and the
 * five parts that make it up — nothing hidden, which is the point.
 */
export function scoreWorker(w: WorkerProfile, input: MatchInput): MatchedWorker {
  const dist = distanceKm(w.location, input.location);

  const primary = w.categories[0] === input.category;
  const skill = w.categories.includes(input.category) ? (primary ? 30 : 24) : 0;

  const distance = Math.max(0, Math.round(25 * (1 - Math.min(dist, 12) / 12)));

  const rating = w.rating > 0 ? Math.round((w.rating / 5) * 20) : 12;

  const budget = input.budget ?? w.wage;
  const over = (w.wage - budget) / Math.max(budget, 1);
  const price = Math.max(0, Math.round(15 * (1 - Math.max(0, over) * 2)));

  const dayHits = input.days.filter((d) => w.availableDays.includes(d)).length;
  const dayFit = input.days.length ? dayHits / input.days.length : 1;
  const wanted = toMins(input.time);
  const timeFit = wanted >= toMins(w.availableFrom) && wanted <= toMins(w.availableTo) ? 1 : 0.35;
  const availability = Math.round(10 * dayFit * timeFit);

  const reasons: MatchedWorker["reasons"] = [];
  if (dist <= 3) reasons.push({ key: "match.reason.near", vars: { n: dist } });
  if (w.rating >= 4.7) reasons.push({ key: "match.reason.rated", vars: { r: w.rating, n: w.jobsCompleted } });
  if (dayFit === 1 && timeFit === 1) reasons.push({ key: "match.reason.free" });
  if (w.wage <= budget) reasons.push({ key: "match.reason.budget" });
  if (w.experienceYears >= 8) reasons.push({ key: "match.reason.exp", vars: { n: w.experienceYears } });

  return {
    worker: w,
    distanceKm: dist,
    score: skill + distance + rating + price + availability,
    breakdown: { skill, distance, rating, price, availability },
    reasons: reasons.slice(0, 3),
  };
}
