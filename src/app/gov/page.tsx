import { getI18n } from "@/i18n/server";
import { CITY } from "@/lib/seed";
import { AnalyticsDashboard, PERIODS } from "@/components/AnalyticsDashboard";
import { PhaseBadge } from "@/components/PhaseBadge";
import type { CategoryId } from "@/lib/types";

export default async function GovDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; district?: string; trade?: string }>;
}) {
  const sp = await searchParams;
  const { t, money, locale } = await getI18n();

  const period = PERIODS.includes(sp.period ?? "") ? sp.period! : PERIODS[PERIODS.length - 1];
  const district = sp.district ?? "all";
  const trade = (sp.trade ?? "all") as CategoryId | "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gov">{t("gov.title")}</h1>
          <p className="text-sm text-slate-700">{t("gov.sub", { city: CITY })}</p>
        </div>
        <PhaseBadge phase={5} t={t} full />
      </div>

      <AnalyticsDashboard
        period={period}
        district={district}
        trade={trade}
        basePath="/gov"
        t={t}
        money={money}
        locale={locale}
      />
    </div>
  );
}
