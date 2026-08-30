import { currentProvider } from "@/lib/session";
import { districtRollup, tradeRollup } from "@/lib/repo";
import { ZONES } from "@/lib/seed";
import { getI18n } from "@/i18n/server";
import { BackLink, Section } from "@/components/ui";
import { PhaseBanner } from "@/components/PhaseBadge";

const PERIOD = "2026-08";

export default async function SkillGapsPage() {
  await currentProvider();
  const { t, money } = await getI18n();

  const trades = tradeRollup(PERIOD, "all").filter((x) => x.shortage > 0);
  const districts = districtRollup(PERIOD, "all");

  return (
    <div className="space-y-6">
      <BackLink href="/training" label={t("tp.nav.home")} />
      <PhaseBanner phase={3} t={t} />

      <div>
        <h1 className="text-2xl font-extrabold">{t("tp.gaps.title")}</h1>
        <p className="text-sm text-slate-600">{t("tp.gaps.sub")}</p>
      </div>

      {/* Same aggregated table as the government view — never individual rows. */}
      <p className="rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-950">🔒 {t("gov.aggregatedOnly")}</p>

      <Section title={t("gov.byTrade")}>
        <ul className="space-y-2">
          {trades.map((x) => (
            <li key={x.trade} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{t(`cat.${x.trade}`)}</p>
                  <p className="text-xs text-slate-600">
                    {t("gov.demand")} {x.demand} · {t("gov.supply")} {x.supply} · {t("gov.avgIncome")}{" "}
                    {money(x.avgWage)}
                  </p>
                </div>
                <span className="pill bg-amber-50 text-amber-900 ring-1 ring-amber-200">
                  {t("tp.gaps.workersShort", { n: x.shortage })}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <span
                    className="block h-full rounded-full bg-amber-500"
                    style={{ width: `${x.trainingDemandSignal}%` }}
                  />
                </span>
                <span className="text-xs font-semibold">
                  {t("tp.gaps.signal")} {x.trainingDemandSignal}%
                </span>
              </div>
            </li>
          ))}
          {trades.length === 0 && <li className="card p-4 text-sm text-slate-600">{t("sp.noTraining")}</li>}
        </ul>
      </Section>

      <Section title={t("gov.byDistrict")}>
        <ul className="space-y-2">
          {districts.map((d) => (
            <li key={d.district} className="card flex items-center justify-between gap-3 p-3 text-sm">
              <span className="font-semibold">{d.district}</span>
              <span className="text-slate-600">
                {t("gov.kpi.fillRate")} {d.fillRate}% · {t("tp.gaps.workersShort", { n: d.shortage })}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-500">
          {ZONES.length} {t("pt.impact.districts").toLowerCase()} · {t("pt.gov.4.d")}
        </p>
      </Section>
    </div>
  );
}
