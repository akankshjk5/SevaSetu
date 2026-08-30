import type { Translate } from "@/i18n";

/**
 * Credibility, not decoration: anything past Phase 1 says so on screen. A
 * partner should never have to guess which parts of this build are real.
 */
export type Phase = 1 | 2 | 3 | 4 | 5;

export function phaseTone(phase: Phase): "live" | "beta" | "roadmap" {
  if (phase === 1) return "live";
  if (phase === 5) return "roadmap";
  return "beta";
}

const TONE_CLASS = {
  live: "bg-teal-50 text-teal-800 ring-1 ring-teal-200",
  beta: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  roadmap: "bg-slate-100 text-slate-700 ring-1 ring-slate-300",
} as const;

const TONE_ICON = { live: "●", beta: "◐", roadmap: "○" } as const;

export function PhaseBadge({ phase, t, full = false }: { phase: Phase; t: Translate; full?: boolean }) {
  const tone = phaseTone(phase);
  const label = full ? t(`phase.${tone}.full`, { n: phase }) : t(`phase.${tone}`);
  return (
    <span className={`pill ${TONE_CLASS[tone]}`} title={t(`phase.explain.${tone}`, { n: phase })}>
      <span aria-hidden>{TONE_ICON[tone]}</span>
      {label}
    </span>
  );
}

/** Full-width note at the top of a Phase 2+ screen. */
export function PhaseBanner({ phase, t }: { phase: Phase; t: Translate }) {
  const tone = phaseTone(phase);
  if (tone === "live") return null;
  return (
    <div className={`rounded-2xl px-4 py-3 ${TONE_CLASS[tone]}`}>
      <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <span aria-hidden>{TONE_ICON[tone]}</span>
        {t("phase.banner.title", { label: t(`phase.${tone}`) })}
        <PhaseBadge phase={phase} t={t} full />
      </p>
      <p className="mt-1 text-xs">{t(`phase.explain.${tone}`, { n: phase })}</p>
      <p className="mt-1 text-xs opacity-80">{t("phase.roadmapNote")}</p>
    </div>
  );
}
