import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { impactSummary } from "@/lib/repo-phases";
import { tradeRollup } from "@/lib/repo";
import { submitInquiry } from "@/lib/actions-phases";
import { CITY } from "@/lib/seed";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PhaseBadge } from "@/components/PhaseBadge";

export const dynamic = "force-dynamic";

const VALUES = [1, 2, 3, 4] as const;
const COMPLEMENTS = [1, 2, 3] as const;
const GOVERNANCE = [1, 2, 3, 4] as const;

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { t, money, num, locale } = await getI18n();
  const impact = impactSummary();
  const shortages = tradeRollup("2026-08", "all").slice(0, 5);

  return (
    <main className="min-h-dvh bg-gov-soft">
      {/* Official treatment, clearly separate from the consumer apps. */}
      <header className="border-b-4 border-amber-400 bg-gov text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="inline-flex min-h-11 items-center font-extrabold">
            🪢 {t("app.name")}
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <LanguageSwitcher locale={locale} tone="dark" />
            <Link href="/login?role=government" className="inline-flex min-h-11 items-center font-semibold underline">
              {t("pt.hero.cta2")}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center gap-2">
          <p className="pill bg-white text-gov ring-1 ring-slate-300">{t("pt.hero.badge")}</p>
          <PhaseBadge phase={5} t={t} full />
        </div>
        <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-extrabold text-gov sm:text-4xl">
          {t("pt.hero.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-700">{t("pt.hero.sub")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#contact" data-tap className="btn btn-gov">
            {t("pt.hero.cta")}
          </a>
          <Link href="/login?role=government" data-tap className="btn btn-ghost">
            {t("pt.hero.cta2")}
          </Link>
        </div>
      </section>

      {/* Impact dashboard preview — headline public-value numbers. */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border border-slate-300 bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gov">{t("pt.impact.title")}</h2>
              <p className="text-sm text-slate-600">{t("pt.impact.sub")}</p>
            </div>
            <span className="pill bg-slate-100 text-slate-700">{CITY}</span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { k: t("pt.impact.workers"), v: num(impact.workersVerified) },
              { k: t("pt.impact.jobs"), v: num(impact.jobsCompleted) },
              { k: t("pt.impact.income"), v: money(impact.incomeDisbursed) },
              { k: t("pt.impact.districts"), v: num(impact.districts) },
              { k: t("pt.impact.signals"), v: num(impact.skillSignals) },
            ].map((x) => (
              <div key={x.k} className="rounded-xl bg-gov-soft p-4">
                <dd className="text-2xl font-extrabold text-gov">{x.v}</dd>
                <dt className="text-xs font-semibold text-slate-700">{x.k}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-5">
            <h3 className="text-sm font-bold">{t("gov.shortages")}</h3>
            <ul className="mt-2 space-y-2">
              {shortages.map((s) => (
                <li key={s.trade} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 font-medium">{t(`cat.${s.trade}`)}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className="block h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, s.trainingDemandSignal)}%` }}
                    />
                  </span>
                  <span className="w-28 text-right text-xs text-slate-600">
                    {t("tp.gaps.workersShort", { n: s.shortage })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-xs text-slate-500">{t("pt.impact.note")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="text-lg font-bold text-gov">{t("pt.value.title")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {VALUES.map((n) => (
            <div key={n} className="rounded-2xl border border-slate-300 bg-white p-5">
              <h3 className="font-bold">{t(`pt.value.${n}.t`)}</h3>
              <p className="mt-1 text-sm text-slate-700">{t(`pt.value.${n}.d`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="text-lg font-bold text-gov">{t("pt.complement.title")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-700">{t("pt.complement.sub")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {COMPLEMENTS.map((n) => (
            <div key={n} className="rounded-2xl border border-slate-300 bg-white p-5">
              <h3 className="font-bold">{t(`pt.complement.${n}.t`)}</h3>
              <p className="mt-1 text-sm text-slate-700">{t(`pt.complement.${n}.d`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data governance — the credibility section. */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border-2 border-gov bg-white p-5">
          <h2 className="text-lg font-bold text-gov">🔒 {t("pt.gov.title")}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {GOVERNANCE.map((n) => (
              <li key={n} className="rounded-xl bg-gov-soft p-4">
                <p className="font-bold">{t(`pt.gov.${n}.t`)}</p>
                <p className="mt-1 text-sm text-slate-700">{t(`pt.gov.${n}.d`)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-950">
            {t("gov.aggregatedOnly")}
          </p>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-slate-300 bg-white p-5">
          <h2 className="text-lg font-bold text-gov">{t("pt.form.title")}</h2>
          <p className="mt-1 text-sm text-slate-700">{t("pt.form.sub")}</p>

          {sp.sent === "1" && (
            <p className="mt-4 rounded-xl bg-teal-50 p-4 text-sm font-semibold text-teal-900 ring-1 ring-teal-200">
              {t("pt.form.thanks")} — {t("pt.form.thanksBody")}
            </p>
          )}
          {sp.error === "1" && (
            <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-800">
              {t("common.required")}
            </p>
          )}

          <form action={submitInquiry} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {t("pt.form.name")}
              <input name="name" className="field mt-1" required />
            </label>
            <label className="block text-sm font-semibold">
              {t("pt.form.email")}
              <input name="email" type="email" className="field mt-1" required />
            </label>
            <label className="block text-sm font-semibold">
              {t("pt.form.department")}
              <input name="department" className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              {t("pt.form.state")}
              <input name="state" className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold sm:col-span-2">
              {t("pt.form.message")}
              <textarea name="message" rows={4} className="field mt-1" />
            </label>
            <div className="sm:col-span-2">
              <button className="btn btn-gov w-full sm:w-auto">{t("pt.form.submit")}</button>
            </div>
          </form>
        </div>
      </section>

      <footer className="border-t border-slate-300 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">{t("app.name")}</p>
          <p className="mt-1">{t("landing.footer")}</p>
          <p className="mt-3">
            <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-gov underline">
              {t("hh.nav.home")}
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
