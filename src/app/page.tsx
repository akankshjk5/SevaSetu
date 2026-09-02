import Link from "next/link";
import { HOUSEHOLD_CATEGORIES, priceUnitKey } from "@/lib/categories";
import { db } from "@/lib/store";
import { CITY } from "@/lib/seed";
import { activeWorkerCount } from "@/lib/repo";
import { demoLogin } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { PhaseBadge, type Phase } from "@/components/PhaseBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InteractiveWorkerShowcase } from "@/components/InteractiveWorkerShowcase";
import { InteractiveWageCalculator } from "@/components/InteractiveWageCalculator";
import { RapidServicesHub } from "@/components/RapidServicesHub";

export const dynamic = "force-dynamic";

const DEMOS = [
  { role: "household", userId: "u_h1", phase: 1 as Phase, icon: "🏠", label: "Household" },
  { role: "worker", userId: "u_w1", phase: 1 as Phase, icon: "🧹", label: "Worker" },
  { role: "contractor", userId: "u_c1", phase: 2 as Phase, icon: "🏗️", label: "Contractor" },
  { role: "training", userId: "u_tp1", phase: 3 as Phase, icon: "🎓", label: "Training Provider" },
  { role: "admin", userId: "u_admin", phase: 1 as Phase, icon: "⚙️", label: "Platform Admin" },
  { role: "government", userId: "u_gov", phase: 5 as Phase, icon: "🏛️", label: "Government Partner" },
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
  const verifiedWorkers = data.workers.filter((w) => w.verified);
  const completed = data.bookings.filter((b) => b.status === "completed").length;

  return (
    <main className="min-h-dvh bg-[#fdfaf5] text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-amber-900/10 bg-white/90 shadow-2xs backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-tight text-teal-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-lg ring-1 ring-teal-200/80 shadow-2xs">
              🪢
            </span>
            <span>{t("app.name")}</span>
            <span className="hidden rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 sm:inline-block">
              {CITY}
            </span>
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold">
            <LanguageSwitcher locale={locale} />
            <Link
              href="/login?role=worker"
              data-tap
              className="hidden rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700 transition hover:bg-slate-50 md:inline-flex"
            >
              {t("login.iWantWork")}
            </Link>
            <Link
              href="/login?role=household"
              data-tap
              className="shrink-0 rounded-lg bg-teal-700 px-2.5 py-1 sm:px-3 sm:py-1.5 font-bold text-white shadow-2xs transition hover:bg-teal-800 active:scale-95 whitespace-nowrap text-xs"
            >
              <span className="sm:hidden">Book Help</span>
              <span className="hidden sm:inline">{t("landing.ctaHousehold")}</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Decorative Heritage Garland */}
      <div className="garland opacity-80" aria-hidden />

      {/* Hero Section: Compact Split Layout with Workers Spotlight Card */}
      <section className="relative overflow-hidden border-b border-amber-900/10 bg-gradient-to-b from-[#fffcf8] via-[#fbf5ed] to-[#f7eee1] py-5 sm:py-10">
        <div className="jaali pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-5 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Compact Headline, Value Proposition, and Action Buttons */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/80 px-2 py-0.5 text-[10px] font-bold text-teal-900 ring-1 ring-teal-300/60">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
                  {t("landing.liveIn", { city: CITY })}
                </span>
                <PhaseBadge phase={1} t={t} full />
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                {t("landing.h1a")}{" "}
                <span className="text-amber-700">{t("landing.h1b")}</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-700 sm:text-base leading-relaxed max-w-lg font-medium">
                {t("landing.sub")}
              </p>

              {/* Action Buttons */}
              <div className="pt-0.5 flex flex-col sm:flex-row gap-2">
                <Link
                  href="/login?role=household"
                  data-tap
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-teal-800 active:scale-95"
                >
                  <span>{t("landing.ctaHousehold")}</span>
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/login?role=worker"
                  data-tap
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50 active:scale-95"
                >
                  {t("landing.ctaWorker")}
                </Link>
              </div>

              {/* Compact Trust Stats Bar */}
              <dl className="pt-1 grid grid-cols-3 gap-1.5 sm:gap-2.5 max-w-sm">
                {[
                  { k: "Workers", v: num(activeWorkerCount()), icon: "🛡️" },
                  { k: "Jobs done", v: num(completed), icon: "✅" },
                  { k: "Insurance", v: t("landing.stat.coverValue"), icon: "🤝" },
                ].map((s) => (
                  <div
                    key={s.k}
                    className="rounded-lg border border-amber-900/10 bg-white/95 px-2 py-1 shadow-2xs text-center sm:text-left"
                  >
                    <span aria-hidden className="text-xs">
                      {s.icon}
                    </span>
                    <dd className="text-sm sm:text-base font-black text-amber-700 leading-none mt-0.5">{s.v}</dd>
                    <dt className="text-[10px] font-semibold text-slate-600 leading-tight mt-0.5 truncate">{s.k}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right Column: Compact Hero Spotlight Photo Card of Real Workers */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-xs sm:max-w-sm lg:max-w-none">
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-amber-400/20 to-teal-500/20 blur-lg opacity-60" />

                <div className="relative overflow-hidden rounded-xl border border-white/90 bg-slate-900 shadow-lg ring-1 ring-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/workers-hero.jpg"
                    alt="SevaSetu Verified Indian Skilled Workers"
                    className="h-48 w-full object-cover sm:h-60 lg:h-72 transition duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                  {/* Top Floating Badge */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-xs backdrop-blur-md">
                      <span>🛡️</span>
                      <span>100% Police Checked</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                      ★ 4.8 / 5
                    </span>
                  </div>

                  {/* Bottom Floating Info Plate */}
                  <div className="absolute bottom-2 inset-x-2 rounded-lg border border-white/20 bg-black/70 p-2 text-white backdrop-blur-md">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">Verified Helpers in {CITY}</p>
                        <p className="text-[10px] text-slate-300 truncate">Cleaners · Cooks · Plumbers · Masons</p>
                      </div>
                      <span className="rounded-md bg-teal-500 px-2 py-0.5 text-[9px] font-black text-slate-950 shrink-0">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rapid Services: Minutes, Errand Runners & Daily Tiffins (Rapido, Flipkart Minutes & Swiggy Genie style) */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <RapidServicesHub city={CITY} />
      </section>

      {/* Service Categories Section (User-Friendly Compact Tiles) */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-1 pb-1">
          <div>
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">{t("landing.needHelp")}</h2>
            <p className="text-[11px] text-slate-500">Pick any household or trade service to find verified workers nearby.</p>
          </div>
          <Link href="/household/post" className="text-xs font-bold text-teal-800 hover:underline">
            All services →
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          {HOUSEHOLD_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              data-tap
              href={`/login?role=household&next=${encodeURIComponent(`/household/post?category=${c.id}`)}`}
              className="card group flex items-center gap-2 p-2.5 transition hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-2xs cursor-pointer"
            >
              <span aria-hidden className="icon-tile shrink-0 group-hover:scale-105 transition !w-7 !h-7 !text-sm">
                {c.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-xs text-slate-900 group-hover:text-teal-800 truncate">
                  {t(`cat.${c.id}`)}
                </h3>
                <p className="text-[10px] font-semibold text-teal-800 truncate">
                  {t("landing.from", { price: money(c.typicalPrice), unit: t(priceUnitKey(c.priceUnit)) })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Dynamic Worker Showcase Section with Live Category Filter & Search */}
      <section className="border-t border-amber-900/10 bg-[#fbf6ee] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 mb-4">
            <div>
              <span className="pill bg-teal-100 text-teal-900 text-[10px] font-bold">Live Verified Network</span>
              <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{t("landing.peopleTitle")}</h2>
              <p className="text-xs text-slate-600">Filter and search verified workers active in your neighbourhood.</p>
            </div>
            <Link href="/login?role=household" className="text-xs font-bold text-teal-800 hover:underline">
              View full roster in {CITY} →
            </Link>
          </div>

          <InteractiveWorkerShowcase
            workers={verifiedWorkers.map((w) => ({
              id: w.id,
              name: w.name,
              photo: w.photo,
              categories: w.categories,
              locality: w.locality,
              experienceYears: w.experienceYears,
              wage: w.wage,
              rating: w.rating,
              jobsCompleted: w.jobsCompleted,
              verified: w.verified,
            }))}
            city={CITY}
          />
        </div>
      </section>

      {/* Interactive Transparent Price & Wage Breakdown Widget */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <InteractiveWageCalculator />
      </section>

      {/* Civil Engineers & Site Contractors Hub Section */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="card border-2 border-amber-500/20 bg-gradient-to-br from-amber-50/40 via-white to-teal-50/20 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/10 pb-3">
            <div>
              <span className="pill bg-amber-100 text-amber-900 text-[10px] font-bold">
                🏗️ For Civil Engineers & Site Contractors
              </span>
              <h2 className="mt-1 text-base sm:text-lg font-black text-slate-900">
                Staff Your Construction Site in Jaipur
              </h2>
              <p className="text-[11px] text-slate-600 max-w-xl">
                Hire verified Masons, Bar Benders, Shuttering Carpenters, and Site Helpers with digital attendance and transparent daily muster rolls.
              </p>
            </div>
            <Link
              href="/login?role=contractor&next=/contractor/projects/new"
              data-tap
              className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 active:scale-95 cursor-pointer"
            >
              <span>Staff Site Crew</span>
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { role: "Mason (Rajgir)", icon: "🧱", wage: "₹850 /day", desc: "Brickwork, plaster, tiles", href: "/household/matches?category=mason" },
              { role: "Shuttering Carpenter", icon: "🪚", wage: "₹900 /day", desc: "Formwork, doors, centering", href: "/household/matches?category=carpenter" },
              { role: "Bar Bender (Saria)", icon: "🔩", wage: "₹800 /day", desc: "Rebar cutting & tying", href: "/household/matches?category=bar-bender" },
              { role: "Site Helper (Beldar)", icon: "👷", wage: "₹550 /day", desc: "Mixing, loading, shifting", href: "/household/matches?category=helper" },
            ].map((item) => (
              <Link
                key={item.role}
                href={item.href}
                className="card flex flex-col justify-between p-2.5 transition hover:border-amber-400 hover:shadow-2xs bg-white cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[10px] font-black text-slate-900">{item.wage}</span>
                  </div>
                  <h4 className="mt-1.5 font-bold text-xs text-slate-900">{item.role}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <span className="mt-2 text-[10px] font-bold text-teal-800">Browse Available →</span>
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-white/80 px-2.5 py-2 text-[10px] text-slate-600 border border-amber-200/50">
            <span>✓ Geofenced Daily Attendance</span>
            <span>✓ Zero Intermediary Cut</span>
            <span>✓ Instant Absentee Substitute</span>
            <span>✓ Legal Labour Compliance</span>
          </div>
        </div>
      </section>

      {/* Built for Real Day-to-Day Life in India */}
      <section className="border-t border-amber-900/10 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="pill bg-teal-100 text-teal-900 text-[10px] font-bold">
              Real Day-to-Day Essentials
            </span>
            <h2 className="mt-1 text-lg sm:text-xl font-black text-slate-900">
              Everything Your Home & Site Actually Needs
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Thoughtfully built for unexpected household emergencies and dependable daily help.
            </p>
          </div>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "⚡",
                title: "60-Min Emergency Fixes",
                desc: "Burst pipe, main MCB trip, or jammed door lock? Verified emergency technicians on call.",
                tag: "Fast Dispatch",
              },
              {
                icon: "🔄",
                title: "Absentee Substitute Guarantee",
                desc: "Daily cook or cleaner on emergency leave? One tap sends an insured verified substitute.",
                tag: "Zero Disruption",
              },
              {
                icon: "🛡️",
                title: "₹2 Lakh Insurance Free",
                desc: "Zero-deductible accidental coverage underwritten on every booking for peace of mind.",
                tag: "100% Protected",
              },
              {
                icon: "📱",
                title: "Simple WhatsApp Job Cards",
                desc: "Workers receive clean job cards in Hindi / English with location, time, and fixed transparent rates.",
                tag: "No Complex Apps",
              },
            ].map((f) => (
              <div key={f.title} className="card p-3 flex flex-col justify-between bg-slate-50/50 hover:border-teal-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{f.icon}</span>
                    <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-teal-800">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-xs sm:text-sm text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Families Trust Us Section (Compact) */}
      <section className="border-y border-amber-900/10 bg-[#fdfaf5] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="pill bg-amber-100 text-amber-900 text-[10px] font-bold">Why Families Trust SevaSetu</span>
            <h2 className="mt-1.5 text-xl font-black text-slate-900 sm:text-2xl">{t("landing.whyTitle")}</h2>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { icon: "🛡️", t: "landing.why1.t", d: "landing.why1.d", tone: "bg-teal-50 text-teal-800" },
              { icon: "🔁", t: "landing.why2.t", d: "landing.why2.d", tone: "bg-amber-50 text-amber-800" },
              { icon: "💳", t: "landing.why3.t", d: "landing.why3.d", tone: "bg-indigo-50 text-indigo-800" },
            ].map((f) => (
              <div
                key={f.t}
                className="card block-print-top relative p-4 transition hover:shadow-xs hover:border-slate-300"
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg shadow-2xs ${f.tone}`}>
                  {f.icon}
                </span>
                <h3 className="mt-2.5 text-sm font-extrabold text-slate-900">{t(f.t)}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{t(f.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact Roadmap Section */}
      <section className="border-b border-amber-900/10 bg-[#fbf6ee] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-lg">
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">{t("landing.roadmapTitle")}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{t("landing.roadmapSub")}</p>
          </div>

          <ol className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {ROADMAP.map((r) => (
              <li key={r.phase} className="card p-3.5 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Phase {r.phase}</span>
                  <PhaseBadge phase={r.phase} t={t} />
                </div>
                <h3 className="mt-1.5 text-sm font-bold text-slate-900">{t(r.titleKey)}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{t(r.bodyKey)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* One-Click Demo Role Accounts (Compact) */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="card border border-teal-700/20 bg-gradient-to-br from-white to-teal-50/40 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="text-lg font-black text-slate-900 sm:text-xl">{t("landing.demoTitle")}</h2>
              <p className="text-xs text-slate-600">{t("landing.demoSub", { city: CITY })}</p>
            </div>
            <span className="pill bg-teal-100 text-teal-900 text-[10px] font-bold self-start sm:self-auto">
              No password needed
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DEMOS.map((d) => (
              <form key={d.role} action={demoLogin}>
                <input type="hidden" name="role" value={d.role} />
                <input type="hidden" name="userId" value={d.userId} />
                <button
                  type="submit"
                  className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-2xs transition hover:border-teal-500 hover:shadow-xs active:scale-97 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base group-hover:scale-105 transition">
                      {d.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-slate-900 group-hover:text-teal-800 transition truncate">
                        {t(`role.${d.role}`)}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{t(`role.${d.role}.sub`)}</p>
                    </div>
                  </div>
                  <PhaseBadge phase={d.phase} t={t} />
                </button>
              </form>
            ))}
          </div>
        </div>
      </section>

      {/* Compact Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-xs">{t("app.name")}</span>
            <span>—</span>
            <span>{t("landing.footer")}</span>
          </div>
          <div>
            <Link href="/partners" className="font-bold text-teal-800 hover:underline">
              {t("landing.govLink")} →
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
