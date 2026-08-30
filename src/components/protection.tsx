import Link from "next/link";
import type { Translate } from "@/i18n";

const COVER = ["c1", "c2", "c3", "c4"] as const;
const ICONS: Record<(typeof COVER)[number], string> = { c1: "🛡️", c2: "🔁", c3: "⚖️", c4: "🧾" };

/**
 * Shown wherever a household is about to pay. Framed as what they gain by
 * paying in the app, never as a warning about paying outside it.
 */
export function ProtectionPanel({
  covered,
  t,
  compact = false,
}: {
  covered: boolean;
  t: Translate;
  compact?: boolean;
}) {
  return (
    <div className={`card p-4 ${covered ? "ring-1 ring-teal-200" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{t("hh.protection.title")}</h3>
          <p className="text-xs text-slate-600">
            {covered ? t("hh.protection.activeOn") : t("hh.protection.turnsOn")}
          </p>
        </div>
        <span
          className={`pill ${covered ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200" : "bg-slate-100 text-slate-700"}`}
        >
          {covered ? `✔ ${t("hh.protection.covered")}` : t("hh.protection.notActive")}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {(compact ? COVER.slice(0, 3) : COVER).map((c) => (
          <li key={c} className="flex gap-3">
            <span aria-hidden className="text-lg">
              {ICONS[c]}
            </span>
            <span>
              <span className="block text-sm font-semibold">{t(`hh.protection.${c}.t`)}</span>
              <span className="block text-xs text-slate-600">{t(`hh.protection.${c}.d`)}</span>
            </span>
          </li>
        ))}
      </ul>

      {!compact && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          {t("hh.protection.cashNote")}{" "}
          <Link
            href="/household/protection"
            className="-my-2 inline-flex min-h-11 items-center font-semibold text-brand"
          >
            {t("hh.protection.whatCovered")}
          </Link>
        </p>
      )}
    </div>
  );
}
