import Link from "next/link";
import { ZONES } from "@/lib/seed";
import { CATEGORIES } from "@/lib/categories";
import { demandTrend, districtRollup, tradeRollup } from "@/lib/repo";
import { formatMonth, formatNumber } from "@/i18n";
import type { Translate } from "@/i18n";
import type { Locale } from "@/i18n/config";
import type { CategoryId } from "@/lib/types";

export const PERIODS = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

/**
 * One analytics surface, two audiences: the platform-admin tab (Phase 4) and
 * the government partner dashboard (Phase 5) render the same component off the
 * same pre-aggregated table. Nothing here can reach an individual record.
 */
export function AnalyticsDashboard({
  period,
  district,
  trade,
  basePath,
  t,
  money,
  locale,
  showExports = true,
}: {
  period: string;
  district: string;
  trade: CategoryId | "all";
  basePath: string;
  t: Translate;
  money: (n: number) => string;
  locale: Locale;
  showExports?: boolean;
}) {
  const districts = districtRollup(period, trade);
  const trades = tradeRollup(period, district);
  const trend = demandTrend(district, trade);

  const totals = trades.reduce(
    (acc, x) => ({
      demand: acc.demand + x.demand,
      supply: acc.supply + x.supply,
      verified: acc.verified + x.verifiedWorkers,
      filled: acc.filled + x.filled,
      income: acc.income + x.filled * x.avgWage,
    }),
    { demand: 0, supply: 0, verified: 0, filled: 0, income: 0 },
  );
  const fillRate = totals.demand ? Math.round((totals.filled / totals.demand) * 100) : 0;
  const shortage = trades.reduce((s, x) => s + x.shortage, 0);

  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ period, district, trade });
    Object.entries(patch).forEach(([k, v]) => p.set(k, v));
    return `${basePath}?${p.toString()}`;
  };

  const maxTrend = Math.max(...trend.map((x) => Math.max(x.demand, x.supply)), 1);
  const chartW = 640;
  const chartH = 180;
  const pointsFor = (key: "demand" | "supply") =>
    trend
      .map((x, i) => {
        const px = (i / Math.max(1, trend.length - 1)) * chartW;
        const py = chartH - (x[key] / maxTrend) * chartH;
        return `${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(" ");

  // min-h-10 keeps these comfortable to tap on a phone — they are the primary
  // control on this screen, not decoration.
  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded px-3 py-1 text-xs font-semibold ${
      active ? "bg-gov text-white" : "bg-slate-100 text-slate-700"
    }`;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-300 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="text-sm font-semibold">
            {t("gov.period")}
            <div className="mt-1 flex flex-wrap gap-1">
              {PERIODS.map((p) => (
                <Link key={p} href={link({ period: p })} className={chip(p === period)}>
                  {formatMonth(p, locale)}
                </Link>
              ))}
            </div>
          </div>
          <div className="text-sm font-semibold">
            {t("gov.district")}
            <div className="mt-1 flex flex-wrap gap-1">
              <Link href={link({ district: "all" })} className={chip(district === "all")}>
                {t("gov.allDistricts")}
              </Link>
              {ZONES.map((z) => (
                <Link key={z.name} href={link({ district: z.name })} className={chip(district === z.name)}>
                  {z.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="text-sm font-semibold">
            {t("gov.trade")}
            <div className="mt-1 flex flex-wrap gap-1">
              <Link href={link({ trade: "all" })} className={chip(trade === "all")}>
                {t("gov.allTrades")}
              </Link>
              {CATEGORIES.map((c) => (
                <Link key={c.id} href={link({ trade: c.id })} className={chip(trade === c.id)}>
                  {t(`cat.${c.id}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {showExports && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/gov/export?period=${period}&district=${district}&trade=${trade}`}
              data-tap
              className="btn btn-gov"
              prefetch={false}
            >
              ⬇ {t("gov.export")} — {t("gov.exportCsv")}
            </Link>
            <Link
              href={`/gov/report?period=${period}&district=${district}&trade=${trade}`}
              data-tap
              className="btn btn-ghost"
            >
              🖨 {t("gov.exportPdf")}
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { k: t("gov.kpi.demand"), v: totals.demand },
          { k: t("gov.supply"), v: totals.supply },
          { k: t("gov.kpi.verified"), v: totals.verified },
          { k: t("gov.kpi.fillRate"), v: `${fillRate}%` },
          { k: t("gov.kpi.shortage"), v: shortage },
        ].map((x) => (
          <div key={x.k} className="rounded-xl border border-slate-300 bg-white p-4">
            <p className="text-2xl font-extrabold text-gov">{x.v}</p>
            <p className="text-sm font-semibold">{x.k}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-4">
        <h2 className="font-bold">{t("gov.trend")}</h2>
        <p className="text-xs text-slate-600">
          {district === "all" ? t("gov.allDistricts") : district} ·{" "}
          {trade === "all" ? t("gov.allTrades") : t(`cat.${trade}`)}
        </p>
        <svg
          viewBox={`0 0 ${chartW} ${chartH + 24}`}
          className="mt-3 w-full overflow-visible"
          role="img"
          aria-label={t("gov.trend")}
        >
          {/* Gridlines and a scale, so a value can actually be read off the
              chart rather than only compared by eye. */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1="0" x2={chartW} y1={chartH * f} y2={chartH * f} stroke="#e2e8f0" strokeWidth="1" />
              <text x="0" y={chartH * f - 4} fontSize="11" fill="#94a3b8">
                {formatNumber(Math.round(maxTrend * (1 - f)), locale)}
              </text>
            </g>
          ))}
          <polyline points={pointsFor("demand")} fill="none" stroke="#1e3a5f" strokeWidth="3" />
          <polyline points={pointsFor("supply")} fill="none" stroke="#d97706" strokeWidth="3" strokeDasharray="6 4" />
          {/* Point markers make each month a readable data point. */}
          {trend.map((x, i) => {
            const px = (i / Math.max(1, trend.length - 1)) * chartW;
            return (
              <g key={`pt-${x.period}`}>
                <circle cx={px} cy={chartH - (x.demand / maxTrend) * chartH} r="4" fill="#1e3a5f" />
                <circle
                  cx={px}
                  cy={chartH - (x.supply / maxTrend) * chartH}
                  r="4"
                  fill="#fff"
                  stroke="#d97706"
                  strokeWidth="2"
                />
              </g>
            );
          })}
          {trend.map((x, i) => (
            <text
              key={x.period}
              x={(i / Math.max(1, trend.length - 1)) * chartW}
              y={chartH + 18}
              textAnchor={i === 0 ? "start" : i === trend.length - 1 ? "end" : "middle"}
              fontSize="12"
              fill="#475569"
            >
              {formatMonth(x.period, locale).split(" ")[0]}
            </text>
          ))}
        </svg>
        <p className="mt-2 text-xs">
          <span className="mr-4 font-semibold text-gov">— {t("gov.demand")}</span>
          <span className="font-semibold text-amber-700">- - {t("gov.supply")}</span>
        </p>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-4">
        <h2 className="font-bold">{t("gov.shortages")}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="p-3">{t("gov.trade")}</th>
                <th className="p-3">{t("gov.demand")}</th>
                <th className="p-3">{t("gov.supply")}</th>
                <th className="p-3">{t("gov.kpi.verified")}</th>
                <th className="p-3">{t("gov.kpi.fillRate")}</th>
                <th className="p-3">{t("gov.avgIncome")}</th>
                <th className="p-3">{t("gov.trainingSignal")}</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((x) => (
                <tr key={x.trade} className="border-t border-slate-100">
                  <td className="p-3 font-semibold">{t(`cat.${x.trade}`)}</td>
                  <td className="p-3">{x.demand}</td>
                  <td className="p-3">{x.supply}</td>
                  <td className="p-3">{x.verifiedWorkers}</td>
                  <td className="p-3">{x.fillRate}%</td>
                  <td className="p-3">{money(x.avgWage)}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                        <span
                          className="block h-full rounded-full bg-amber-500"
                          style={{ width: `${x.trainingDemandSignal}%` }}
                        />
                      </span>
                      <span className="text-xs font-semibold">{x.trainingDemandSignal}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-4">
        <h2 className="font-bold">{t("gov.byDistrict")}</h2>
        <ul className="mt-3 space-y-3">
          {districts.map((d) => (
            <li key={d.district}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold">{d.district}</span>
                <span className="text-slate-600">
                  {d.demand} {t("gov.demand").toLowerCase()} · {d.supply} {t("gov.supply").toLowerCase()} ·{" "}
                  {d.fillRate}% {t("gov.filled").toLowerCase()}
                </span>
              </div>
              <span className="mt-1 flex h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <span className="block h-full bg-gov" style={{ width: `${d.fillRate}%` }} />
                <span className="block h-full bg-amber-400" style={{ width: `${Math.max(0, 100 - d.fillRate)}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs">
          <span className="mr-4 font-semibold text-gov">■ {t("gov.filled")}</span>
          <span className="font-semibold text-amber-700">■ {t("gov.kpi.shortage")}</span>
        </p>
      </section>
    </div>
  );
}
