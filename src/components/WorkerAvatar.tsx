import type { CategoryId } from "@/lib/types";

/**
 * Illustrated portrait for a worker.
 *
 * Deliberately an illustration, not a photograph: this build ships no licensed
 * photos, and putting stock photos of real people behind fictional worker names
 * would misrepresent them. If a real, licensed photo is later stored on
 * `WorkerProfile.photo`, it is rendered instead — no other change needed.
 *
 * The variant is picked from the worker's id and trade, never from guessing
 * anything about the person from their name.
 */

const SKIN = ["#8d5524", "#a9673b", "#c68642", "#e0ac69", "#7a4a21"];
const HAIR = ["#1c1917", "#2b2118", "#3b2a1e"];

/** Warm, saturated cloth colours you actually see on an Indian street. */
const CLOTH = ["#c2410c", "#0f766e", "#b45309", "#7c3aed", "#be123c", "#1d4ed8", "#047857", "#a16207"];

/** Head covering by trade — safety and practicality, not gender. */
type HeadGear = "helmet" | "sunhat" | "cap" | "chefcap" | "none";

const HEADGEAR: Partial<Record<CategoryId, HeadGear>> = {
  mason: "helmet",
  carpenter: "helmet",
  painter: "cap",
  "bar-bender": "helmet",
  helper: "helmet",
  gardener: "sunhat",
  cook: "chefcap",
  plumber: "cap",
  electrician: "cap",
  mover: "cap",
};

/**
 * Ids in this build are short ("w1", "w2"), so bit-shifting one hash gives every
 * worker nearly the same variant. Salting per attribute spreads them properly.
 */
function hash(seed: string, salt: string) {
  let h = 2166136261;
  const s = `${salt}:${seed}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function WorkerAvatar({
  id,
  name,
  trade,
  photo,
  size = 48,
  ring = false,
}: {
  id: string;
  name: string;
  trade?: CategoryId;
  photo?: string;
  size?: number;
  /** Adds a warm ring — used where the avatar is the focus of the card. */
  ring?: boolean;
}) {
  // A real licensed photo always wins over the illustration.
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${ring ? "ring-2 ring-amber-300" : ""}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const seed = id || name;
  const skin = SKIN[hash(seed, "skin") % SKIN.length];
  const hair = HAIR[hash(seed, "hair") % HAIR.length];
  const kurta = CLOTH[hash(seed, "kurta") % CLOTH.length];
  let scarf = CLOTH[hash(seed, "scarf") % CLOTH.length];
  if (scarf === kurta) scarf = CLOTH[(CLOTH.indexOf(kurta) + 3) % CLOTH.length];
  const gear: HeadGear = (trade && HEADGEAR[trade]) || "none";
  // A shawl/dupatta band appears on some illustrations, chosen by id.
  const hasShawl = hash(seed, "shawl") % 2 === 1 && gear !== "helmet";
  const bg = `hsl(${20 + (hash(seed, "bg") % 40)}, 70%, 94%)`;

  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-full ${ring ? "ring-2 ring-amber-300" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={name}>
        <rect width="64" height="64" fill={bg} />

        {/* shoulders / kurta */}
        <path d="M6 64c0-13 11-20 26-20s26 7 26 20z" fill={kurta} />
        {/* kurta placket */}
        <path d="M32 44v20" stroke="rgba(0,0,0,.18)" strokeWidth="1.5" />
        {hasShawl && (
          <path d="M14 51c6 6 12 9 18 9s12-3 18-9l3 13H11z" fill={scarf} opacity="0.95" />
        )}

        {/* neck + head */}
        <rect x="28" y="34" width="8" height="8" rx="3" fill={skin} />
        <ellipse cx="32" cy="26" rx="12" ry="13" fill={skin} />

        {/* hair */}
        {gear === "none" || gear === "chefcap" || gear === "cap" ? (
          <path d="M20 24c0-8 5-12 12-12s12 4 12 12c0-4-4-6-12-6s-12 2-12 6z" fill={hair} />
        ) : null}

        {/* eyes + smile — small, friendly, low detail so it reads at 32px */}
        <circle cx="27" cy="26" r="1.6" fill="#1c1917" />
        <circle cx="37" cy="26" r="1.6" fill="#1c1917" />
        <path d="M28 31c2 2 6 2 8 0" stroke="#1c1917" strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* head gear */}
        {gear === "helmet" && (
          <>
            <path d="M18 22a14 14 0 0 1 28 0z" fill="#f59e0b" />
            <rect x="15" y="21" width="34" height="3.5" rx="1.75" fill="#d97706" />
            <path d="M32 8v6" stroke="#d97706" strokeWidth="2" />
          </>
        )}
        {gear === "sunhat" && (
          <>
            <ellipse cx="32" cy="22" rx="20" ry="4" fill="#ca8a04" />
            <path d="M22 21a10 10 0 0 1 20 0z" fill="#eab308" />
          </>
        )}
        {gear === "cap" && (
          <>
            <path d="M20 20a12 12 0 0 1 24 0z" fill={scarf} />
            <path d="M44 20h6a2 2 0 0 1 0 4h-6z" fill={scarf} opacity="0.85" />
          </>
        )}
        {gear === "chefcap" && (
          <>
            <rect x="21" y="16" width="22" height="6" rx="2" fill="#f8fafc" />
            <path d="M22 16c-2-6 4-9 10-9s12 3 10 9z" fill="#f8fafc" />
          </>
        )}
      </svg>
    </span>
  );
}
