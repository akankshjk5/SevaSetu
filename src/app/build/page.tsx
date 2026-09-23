import Link from "next/link";
import { CATEGORY_MAP, priceUnitKey } from "@/lib/categories";
import { planBuild } from "@/lib/construction";
import { CITY } from "@/lib/seed";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhaseBadge } from "@/components/PhaseBadge";

export const dynamic = "force-dynamic";

const SIZES = [1000, 1500, 2000, 3000, 5000];

/**
 * The construction chain, made concrete.
 *
 * The claim this platform makes is that a person building a house should not
 * have to find an architect, then a contractor, then a mason, then an
 * electrician, separately and in the dark. So this page takes one number — the
 * built-up area — and returns the whole workforce in the order it is needed,
 * with headcount, duration, cost and who is actually available today.
 */
/** Indic plurals do not follow English rules, so the count picks the key. */
function people(t: (k: string, v?: Record<string, string | number>) => string, n: number) {
  return n === 1 ? t("build.person") : t("build.people", { n });
}
function days(t: (k: string, v?: Record<string, string | number>) => string, n: number) {
  return n === 1 ? t("build.day") : t("build.days", { n });
}

export default async function BuildPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ sqft?: string; optional?: string }>;
}) {
  const sp = await searchParams;
  const { t, money, num, locale } = await getI18n();

  const sqft = Number(sp.sqft) || 1500;
  const includeOptional = sp.optional !== "0";
  const plan = planBuild(sqft, includeOptional);

  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ sqft: String(plan.sqft), optional: includeOptional ? "1" : "0" });
    Object.entries(patch).forEach(([k, v]) => p.set(k, v));
    return `/build?${p.toString()}`;
  };

  return (
    <main className="min-h-dvh bg-[#fdfaf5] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-amber-900/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-2 text-lg font-black text-teal-800">
            <span aria-hidden>🪢</span> {t("app.name")}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <Link href="/login?role=contractor" data-tap className="btn btn-ghost text-sm">
              {t("role.contractor")}
            </Link>
          </div>
        </div>
      </header>
      <div className="garland" aria-hidden />

      <section className="jaali border-b border-amber-900/10">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill bg-amber-100 text-amber-900">🏗️ {t("build.nav")}</span>
            <PhaseBadge phase={2} t={t} full />
          </div>
          <h1 className="mt-3 max-w-3xl text-2xl font-black tracking-tight sm:text-4xl">{t("build.title")}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700 sm:text-base">{t("build.sub")}</p>

          {/* One input: the size of the house. */}
          <div className="mt-5">
            <p className="text-sm font-bold">{t("build.sqft")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <Link
                  key={s}
                  href={link({ sqft: String(s) })}
                  data-tap
                  aria-current={plan.sqft === s}
                  className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold ${
                    plan.sqft === s ? "bg-teal-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-300"
                  }`}
                >
                  {num(s)}
                </Link>
              ))}
              <Link
                href={link({ optional: includeOptional ? "0" : "1" })}
                data-tap
                aria-pressed={includeOptional}
                className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold ${
                  includeOptional ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300" : "bg-white text-slate-600 ring-1 ring-slate-300"
                }`}
              >
                {includeOptional ? t("build.includeOptional") : t("build.essentialOnly")}
              </Link>
            </div>
          </div>

          {/* The answer, before the detail. */}
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <dt className="text-xs font-semibold text-slate-600">{t("build.totalCost")}</dt>
              <dd className="text-2xl font-black text-teal-800">{money(plan.totalCost)}</dd>
            </div>
            <div className="card p-4">
              <dt className="text-xs font-semibold text-slate-600">{t("build.totalDays", { n: plan.totalDays })}</dt>
              <dd className="text-2xl font-black text-amber-700">{num(plan.totalDays)}</dd>
            </div>
            <div className="card p-4">
              <dt className="text-xs font-semibold text-slate-600">
                {t("build.totalPeople", { n: plan.totalPeople, p: plan.phases.length })}
              </dt>
              <dd className="text-2xl font-black">{num(plan.totalPeople)}</dd>
            </div>
          </dl>
          <p className="mt-3 max-w-2xl text-xs text-slate-600">
            {t("build.estimateNote", { sqft: num(plan.sqft) })}
          </p>
        </div>
      </section>

      {/* The chain itself, phase by phase. */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-lg font-black">{t("build.chainTitle")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{t("build.chainBody")}</p>

        <ol className="mt-5 space-y-4">
          {plan.phases.map((p) => (
            <li key={p.phase.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/80 p-4">
                <span aria-hidden className="icon-tile">
                  {p.phase.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black tracking-wide text-terracotta uppercase">
                    {t("build.step", { n: p.phase.step })}
                  </p>
                  <h3 className="font-black">{t(`build.phase.${p.phase.id}`)}</h3>
                  <p className="text-xs text-slate-600">{t(`build.phase.${p.phase.id}.d`)}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-teal-800">{money(p.cost)}</p>
                  {p.days > 0 && <p className="text-xs text-slate-600">{days(t, p.days)}</p>}
                </div>
              </div>

              <ul className="divide-y divide-slate-100">
                {p.roles.map((r) => {
                  const cat = CATEGORY_MAP[r.trade];
                  return (
                    <li key={`${p.phase.id}-${r.trade}`} className="flex flex-wrap items-center gap-3 p-4">
                      <span aria-hidden className="text-xl">
                        {cat.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-bold">{t(`cat.${r.trade}`)}</span>
                          <span className="pill bg-slate-100 text-slate-700">{t(`tier.${cat.tier}`)}</span>
                          {!r.essential && <span className="pill bg-slate-100 text-slate-600">{t("build.optional")}</span>}
                        </span>
                        <span className="block text-xs text-slate-600">
                          {cat.priceUnit === "per project"
                            ? t(priceUnitKey(cat.priceUnit))
                            : `${people(t, r.headcount)} · ${days(t, r.days)}`}
                          {" · "}
                          {r.available > 0 ? (
                            <span className="font-semibold text-teal-800">{t("build.available", { n: r.available })}</span>
                          ) : (
                            <span className="font-semibold text-amber-800">{t("build.none")}</span>
                          )}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-bold">{money(r.cost)}</span>
                      </span>
                      {r.available > 0 && (
                        <Link
                          href={`/login?role=household&next=${encodeURIComponent(`/household/matches?category=${r.trade}`)}`}
                          data-tap
                          className="btn btn-ghost text-xs"
                        >
                          {t("build.hire", { trade: t(`cat.${r.trade}`) })}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>

        {/* Say plainly where the platform cannot yet deliver. */}
        {plan.gaps.length > 0 && (
          <div className="card mt-6 border-amber-300 bg-amber-50 p-4">
            <h3 className="font-black">{t("build.gapsTitle", { city: CITY })}</h3>
            <p className="mt-1 text-sm text-amber-950">{t("build.gapsBody")}</p>
            <p className="mt-2 flex flex-wrap gap-2">
              {plan.gaps.map((g) => (
                <span key={g} className="pill bg-white text-amber-900 ring-1 ring-amber-300">
                  {CATEGORY_MAP[g].icon} {t(`cat.${g}`)}
                </span>
              ))}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
