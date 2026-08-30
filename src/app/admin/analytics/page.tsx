import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { AnalyticsDashboard, PERIODS } from "@/components/AnalyticsDashboard";
import { PhaseBadge } from "@/components/PhaseBadge";
import type { CategoryId } from "@/lib/types";

export default async function AdminAnalyticsPage({
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
          <h1 className="text-2xl font-extrabold">{t("ad.analytics.title")}</h1>
          <p className="text-sm text-slate-600">{t("ad.analytics.sub")}</p>
        </div>
        <div className="flex items-center gap-2">
          <PhaseBadge phase={4} t={t} full />
          <Link href="/gov" className="btn btn-ghost text-sm">
            {t("role.government")}
          </Link>
        </div>
      </div>

      <AnalyticsDashboard
        period={period}
        district={district}
        trade={trade}
        basePath="/admin/analytics"
        t={t}
        money={money}
        locale={locale}
      />
    </div>
  );
}
