import Link from "next/link";
import type { ReactNode } from "react";
import type { BookingStatus, WorkerProfile } from "@/lib/types";
import type { Translate } from "@/i18n";
import { formatDate as fmtDate, formatMoney, formatShortDate as fmtShort } from "@/i18n";
import type { Locale } from "@/i18n/config";

/**
 * Every component here that renders words takes `t`, so no screen can quietly
 * hardcode English.
 */

export function money(n: number, locale: Locale = "en") {
  return formatMoney(n, locale);
}

const AVATAR_COLOURS = ["#0f766e", "#b45309", "#7c3aed", "#be123c", "#1d4ed8", "#047857", "#c2410c"];

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const colour = AVATAR_COLOURS[name.charCodeAt(0) % AVATAR_COLOURS.length];
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, background: colour, fontSize: size * 0.36 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
    >
      {initials}
    </span>
  );
}

export function Stars({ rating, count, t }: { rating: number; count?: number; t: Translate }) {
  if (!rating) return <span className="text-sm text-slate-500">{t("common.newWorker")}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span aria-hidden className="text-amber-500">
        ★
      </span>
      <strong>{rating.toFixed(1)}</strong>
      {count !== undefined && <span className="text-slate-500">({t("common.jobs", { n: count })})</span>}
    </span>
  );
}

export function VerifiedBadge({ t, compact = false }: { t: Translate; compact?: boolean }) {
  return (
    <span className="pill bg-teal-50 text-teal-800 ring-1 ring-teal-200">
      <span aria-hidden>🛡️</span>
      {compact ? t("badge.verified.short") : t("badge.verified")}
    </span>
  );
}

export function UnverifiedBadge({ t }: { t: Translate }) {
  return (
    <span className="pill bg-amber-50 text-amber-800 ring-1 ring-amber-200">
      <span aria-hidden>⏳</span> {t("badge.unverified")}
    </span>
  );
}

/** Phase 3 sub-badge shown next to "Verified" once a skill check is passed. */
export function CertifiedBadge({ t }: { t: Translate }) {
  return (
    <span className="pill bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200" title={t("sp.certifiedExplain")}>
      <span aria-hidden>🎓</span> {t("sp.certified")}
    </span>
  );
}

const STATUS_META: Record<BookingStatus, { cls: string; icon: string }> = {
  requested: { cls: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", icon: "⏳" },
  confirmed: { cls: "bg-blue-50 text-blue-800 ring-1 ring-blue-200", icon: "✔" },
  "en-route": { cls: "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200", icon: "🛵" },
  arrived: { cls: "bg-violet-50 text-violet-800 ring-1 ring-violet-200", icon: "📍" },
  "in-progress": { cls: "bg-amber-50 text-amber-900 ring-1 ring-amber-200", icon: "🧹" },
  completed: { cls: "bg-teal-50 text-teal-800 ring-1 ring-teal-200", icon: "✅" },
  cancelled: { cls: "bg-rose-50 text-rose-800 ring-1 ring-rose-200", icon: "✕" },
  declined: { cls: "bg-rose-50 text-rose-800 ring-1 ring-rose-200", icon: "✕" },
};

export function StatusPill({ status, t }: { status: BookingStatus; t: Translate }) {
  const m = STATUS_META[status];
  return (
    <span className={`pill ${m.cls}`}>
      <span aria-hidden>{m.icon}</span>
      {t(`st.${status}`)}
    </span>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ title, body, cta }: { title: string; body: string; cta?: ReactNode }) {
  return (
    <div className="card p-6 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
      {cta && <div className="mt-4 flex justify-center">{cta}</div>}
    </div>
  );
}

export function WorkerLine({ worker }: { worker: WorkerProfile }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar name={worker.name} size={32} />
      <span className="font-semibold">{worker.name}</span>
    </span>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} data-tap className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600">
      ← {label}
    </Link>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
}: {
  value: number;
  max?: number;
  tone?: "brand" | "gov" | "amber";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = tone === "gov" ? "#1e3a5f" : tone === "amber" ? "#d97706" : "#0f766e";
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: colour }} />
    </span>
  );
}

export function formatDate(iso: string, locale: Locale = "en") {
  return fmtDate(iso, locale);
}

export function formatShortDate(iso: string, locale: Locale = "en") {
  return fmtShort(iso, locale);
}

export function daysLabel(days: number[], t: Translate) {
  if (days.length === 7) return t("day.everyday");
  if (days.length === 6 && !days.includes(0)) return t("day.monToSat");
  return days
    .slice()
    .sort()
    .map((d) => t(`day.${d}`))
    .join(", ");
}

export const DAY_INDEXES = [0, 1, 2, 3, 4, 5, 6];
