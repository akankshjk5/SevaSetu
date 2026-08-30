import Link from "next/link";
import { districtRollup, tradeRollup } from "@/lib/repo";
import { getI18n } from "@/i18n/server";
import { formatMonth } from "@/i18n";
import { CITY } from "@/lib/seed";
import type { CategoryId } from "@/lib/types";

export default async function GovReport({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; district?: string; trade?: string }>;
}) {
  const sp = await searchParams;
  const { t, money, locale } = await getI18n();

  const period = sp.period ?? "2026-08";
  const district = sp.district ?? "all";
  const trade = (sp.trade ?? "all") as CategoryId | "all";

  const trades = tradeRollup(period, district);
  const districts = districtRollup(period, trade);
  const totals = trades.reduce(
    (a, x) => ({
      demand: a.demand + x.demand,
      supply: a.supply + x.supply,
      filled: a.filled + x.filled,
      verified: a.verified + x.verifiedWorkers,
    }),
    { demand: 0, supply: 0, filled: 0, verified: 0 },
  );
  const shortlist = trades.filter((x) => x.trainingDemandSignal >= 20).slice(0, 3);

  return (
    <div className="space-y-5 bg-white p-6 print:p-0">
      <div className="no-print flex flex-wrap gap-2">
        <Link href={`/gov?period=${period}&district=${district}&trade=${trade}`} className="btn btn-ghost">
          ← {t("gov.back")}
        </Link>
        <Link
          href={`/gov/export?period=${period}&district=${district}&trade=${trade}`}
          className="btn btn-gov"
          prefetch={false}
        >
          ⬇ {t("gov.exportCsv")}
        </Link>
        <span className="btn btn-ghost">{t("gov.report.printHint")}</span>
      </div>

      <header className="border-b-2 border-gov pb-3">
        <p className="text-xs tracking-widest text-slate-500 uppercase">
          {t("role.government")} · {CITY}
        </p>
        <h1 className="text-2xl font-extrabold">{t("gov.reportTitle")}</h1>
        <p className="text-sm text-slate-600">
          {formatMonth(period, locale)} · {district === "all" ? t("gov.allDistricts") : district} ·{" "}
          {trade === "all" ? t("gov.allTrades") : t(`cat.${trade}`)}
        </p>
        <p className="mt-2 text-xs font-semibold text-amber-800">{t("gov.report.noPersonal")}</p>
      </header>

      <section>
        <h2 className="font-bold">{t("gov.report.glance")}</h2>
        <table className="mt-2 w-full text-sm">
          <tbody>
            {[
              [t("gov.kpi.demand"), totals.demand],
              [t("gov.supply"), totals.supply],
              [t("gov.kpi.verified"), totals.verified],
              [t("gov.kpi.fillRate"), `${totals.demand ? Math.round((totals.filled / totals.demand) * 100) : 0}%`],
              [t("gov.kpi.shortage"), trades.reduce((s, x) => s + x.shortage, 0)],
            ].map(([k, v]) => (
              <tr key={String(k)} className="border-b border-slate-100">
                <td className="py-2 text-slate-600">{k}</td>
                <td className="py-2 text-right font-bold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-bold">{t("gov.byTrade")}</h2>
        <table className="mt-2 w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="p-2">{t("gov.trade")}</th>
              <th className="p-2">{t("gov.demand")}</th>
              <th className="p-2">{t("gov.supply")}</th>
              <th className="p-2">{t("gov.kpi.verified")}</th>
              <th className="p-2">{t("gov.kpi.fillRate")}</th>
              <th className="p-2">{t("gov.avgIncome")}</th>
              <th className="p-2">{t("gov.trainingSignal")}</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((x) => (
              <tr key={x.trade} className="border-b border-slate-100">
                <td className="p-2 font-semibold">{t(`cat.${x.trade}`)}</td>
                <td className="p-2">{x.demand}</td>
                <td className="p-2">{x.supply}</td>
                <td className="p-2">{x.verifiedWorkers}</td>
                <td className="p-2">{x.fillRate}%</td>
                <td className="p-2">{money(x.avgWage)}</td>
                <td className="p-2">{x.trainingDemandSignal}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-bold">{t("gov.byDistrict")}</h2>
        <table className="mt-2 w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="p-2">{t("gov.district")}</th>
              <th className="p-2">{t("gov.demand")}</th>
              <th className="p-2">{t("gov.supply")}</th>
              <th className="p-2">{t("gov.kpi.verified")}</th>
              <th className="p-2">{t("gov.kpi.fillRate")}</th>
              <th className="p-2">{t("gov.kpi.shortage")}</th>
            </tr>
          </thead>
          <tbody>
            {districts.map((d) => (
              <tr key={d.district} className="border-b border-slate-100">
                <td className="p-2 font-semibold">{d.district}</td>
                <td className="p-2">{d.demand}</td>
                <td className="p-2">{d.supply}</td>
                <td className="p-2">{d.verifiedWorkers}</td>
                <td className="p-2">{d.fillRate}%</td>
                <td className="p-2">{d.shortage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {shortlist.length > 0 && (
        <section>
          <h2 className="font-bold">{t("gov.report.trainingHelp")}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {shortlist.map((x) => (
              <li key={x.trade}>
                {t("gov.report.trainingLine", {
                  trade: t(`cat.${x.trade}`),
                  demand: x.demand,
                  supply: x.supply,
                  wage: money(x.avgWage),
                })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-slate-200 pt-3 text-xs text-slate-500">{t("gov.report.footer")}</footer>
    </div>
  );
}
