import Link from "next/link";
import { HOUSEHOLD_CATEGORIES, priceUnitKey } from "@/lib/categories";
import { db } from "@/lib/store";
import { CITY } from "@/lib/seed";
import { activeWorkerCount } from "@/lib/repo";
import { demoLogin } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { Stars, VerifiedBadge } from "@/components/ui";
import { PhaseBadge, type Phase } from "@/components/PhaseBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WorkerAvatar } from "@/components/WorkerAvatar";

export const dynamic = "force-dynamic";

const DEMOS = [
  { role: "household", userId: "u_h1", phase: 1 as Phase, href: "/household" },
  { role: "worker", userId: "u_w1", phase: 1 as Phase, href: "/worker" },
  { role: "contractor", userId: "u_c1", phase: 2 as Phase, href: "/contractor" },
  { role: "training", userId: "u_tp1", phase: 3 as Phase, href: "/training" },
  { role: "admin", userId: "u_admin", phase: 1 as Phase, href: "/admin" },
  { role: "government", userId: "u_gov", phase: 5 as Phase, href: "/gov" },
];

const ROADMAP: { phase: Phase; titleKey: string; bodyKey: string }[] = [
  { phase: 1, titleKey: "roadmap.p1.t", bodyKey: "roadmap.p1.d" },
  { phase: 2, titleKey: "roadmap.p2.t", bodyKey: "roadmap.p2.d" },
  { phase: 3, titleKey: "roadmap.p3.t", bodyKey: "roadmap.p3.d" },
  { phase: 4, titleKey: "roadmap.p4.t", bodyKey: "roadmap.p4.d" },
  { phase: 5, titleKey: "roadmap.p5.t", bodyKey: "roadmap.p5.d" },
];

export default async function LandingPage() {
  const { t, money, locale, num } = await getI18n();
  const data = db();
  const workers = data.workers.filter((w) => w.verified).slice(0, 3);
  const completed = data.bookings.filter((b) => b.status === "completed").length;

  return (
    <main className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-h-11 items-center gap-2 font-extrabold text-brand">
            <span aria-hidden className="text-xl">🪢</span> {t("app.name")}
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <LanguageSwitcher locale={locale} />
            <Link href="/login?role=worker" data-tap className="btn btn-ghost hidden sm:inline-flex">
              {t("login.iWantWork")}
            </Link>
            <Link href="/login?role=household" data-tap className="btn btn-primary">
              {t("landing.ctaHousehold")}
            </Link>
          </nav>
        </div>
      </header>
      {/* Marigold garland, as hung over a doorway on an opening day. */}
      <div className="garland" aria-hidden />

      <section className="jaali mx-auto max-w-5xl px-4 pt-10 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="pill bg-brand-soft text-teal-900">{t("landing.liveIn", { city: CITY })}</p>
          <PhaseBadge phase={1} t={t} full />
        </div>
        <h1 className="mt-3 text-3xl leading-tight font-extrabold sm:text-5xl">
          {t("landing.h1a")}
          <br />
          <span className="text-brand">{t("landing.h1b")}</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">{t("landing.sub")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login?role=household" data-tap className="btn btn-primary">
            {t("landing.ctaHousehold")}
          </Link>
          <Link href="/login?role=worker" data-tap className="btn btn-dark">
            {t("landing.ctaWorker")}
          </Link>
          <Link href="/partners" data-tap className="btn btn-ghost">
            {t("landing.govLink")}
          </Link>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-3">
          {[
            { k: t("landing.stat.workers"), v: num(activeWorkerCount()), icon: "🛡️" },
            { k: t("landing.stat.jobs"), v: num(completed), icon: "✅" },
            { k: t("landing.stat.cover"), v: t("landing.stat.coverValue"), icon: "🤝" },
          ].map((s) => (
            <div key={s.k} className="card p-4">
              <span aria-hidden className="text-lg">
                {s.icon}
              </span>
              <dd className="mt-1 text-xl font-extrabold text-terracotta sm:text-2xl">{s.v}</dd>
              <dt className="text-xs leading-tight text-slate-600">{s.k}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="text-lg font-bold">{t("landing.needHelp")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HOUSEHOLD_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              data-tap
              href={`/login?role=household&next=${encodeURIComponent(`/household/post?category=${c.id}`)}`}
              className="card flex flex-col gap-1 bg-marigold-soft/40 p-4 hover:border-amber-400"
            >
              <span aria-hidden className="icon-tile">
                {c.icon}
              </span>
              <span className="font-semibold">{t(`cat.${c.id}`)}</span>
              <span className="text-xs text-slate-600">{t(`cat.${c.id}.blurb`)}</span>
              <span className="mt-1 text-xs font-semibold text-brand">
                {t("landing.from", { price: money(c.typicalPrice), unit: t(priceUnitKey(c.priceUnit)) })}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="text-lg font-bold">{t("landing.whyTitle")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { icon: "🛡️", t: "landing.why1.t", d: "landing.why1.d" },
            { icon: "🔁", t: "landing.why2.t", d: "landing.why2.d" },
            { icon: "💳", t: "landing.why3.t", d: "landing.why3.d" },
          ].map((f) => (
            <div key={f.t} className="card block-print-top p-5">
              <span aria-hidden className="icon-tile">
                {f.icon}
              </span>
              <h3 className="mt-2 font-bold">{t(f.t)}</h3>
              <p className="mt-1 text-sm text-slate-600">{t(f.d)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="text-lg font-bold">{t("landing.peopleTitle")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {workers.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex items-center gap-3">
                <WorkerAvatar id={w.id} name={w.name} trade={w.categories[0]} photo={w.photo} ring />
                <div>
                  <p className="font-semibold">{w.name}</p>
                  <p className="text-xs text-slate-600">
                    {w.locality} · {t("common.yearsExperience", { n: w.experienceYears })}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Stars rating={w.rating} count={w.jobsCompleted} t={t} />
                <span className="text-sm font-bold">{money(w.wage)}</span>
              </div>
              <div className="mt-3">
                <VerifiedBadge t={t} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The roadmap, stated plainly — every phase carries its own badge. */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="text-lg font-bold">{t("landing.roadmapTitle")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{t("landing.roadmapSub")}</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r) => (
            <li key={r.phase} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">Phase {r.phase}</span>
                <PhaseBadge phase={r.phase} t={t} />
              </div>
              <h3 className="mt-2 font-bold">{t(r.titleKey)}</h3>
              <p className="mt-1 text-sm text-slate-600">{t(r.bodyKey)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="card p-5">
          <h2 className="text-lg font-bold">{t("landing.demoTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("landing.demoSub", { city: CITY })}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {DEMOS.map((d) => (
              <form key={d.role} action={demoLogin}>
                <input type="hidden" name="role" value={d.role} />
                <input type="hidden" name="userId" value={d.userId} />
                <button className="btn btn-ghost w-full !items-start flex-col gap-1 text-left">
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-bold">{t(`role.${d.role}`)}</span>
                    <PhaseBadge phase={d.phase} t={t} />
                  </span>
                  <span className="text-xs font-normal text-slate-600">{t(`role.${d.role}.sub`)}</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">{t("app.name")}</p>
          <p className="mt-1">{t("landing.footer")}</p>
          <p className="mt-3">
            <Link href="/partners" className="inline-flex min-h-11 items-center font-semibold text-brand">
              {t("landing.govLink")}
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
