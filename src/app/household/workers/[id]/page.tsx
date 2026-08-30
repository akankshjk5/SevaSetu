import { notFound } from "next/navigation";
import { getWorker, verificationFor, workerReviews } from "@/lib/repo";
import { certifiedTrades, isCertified, skillPassport } from "@/lib/repo-phases";
import { CATEGORY_MAP, priceUnitKey } from "@/lib/categories";
import { bookWorker } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { ProtectionPanel } from "@/components/protection";
import { PhaseBadge } from "@/components/PhaseBadge";
import { Avatar, BackLink, CertifiedBadge, Stars, VerifiedBadge, daysLabel } from "@/components/ui";
import type { CategoryId } from "@/lib/types";
import { WorkerAvatar } from "@/components/WorkerAvatar";

const STEPS = [
  { key: "govId", label: "hh.worker.badge1" },
  { key: "policeCheck", label: "hh.worker.badge2" },
  { key: "skillCheck", label: "hh.worker.badge3" },
  { key: "insurance", label: "hh.worker.badge4" },
] as const;

export default async function WorkerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const worker = getWorker(id);
  if (!worker) notFound();

  const { t, money, date: fmtDate } = await getI18n();
  const reviews = workerReviews(worker.id);
  const rec = verificationFor(worker.id);
  const passport = skillPassport(worker);

  const category = (sp.category ?? worker.categories[0]) as CategoryId;
  const cat = CATEGORY_MAP[category];
  const days = (sp.days ?? worker.availableDays.join(",")).split(",").filter(Boolean).map(Number);
  const type = sp.type ?? "recurring";
  const date = sp.date ?? new Date().toISOString().slice(0, 10);
  const time = sp.time ?? worker.availableFrom;
  const duration = Number(sp.duration ?? 90);
  const price = Number(sp.price ?? worker.wage);

  const backHref = `/household/matches?${new URLSearchParams({
    category,
    type,
    days: days.join(","),
    date,
    time,
    duration: String(duration),
  }).toString()}`;

  const durationLabel = duration >= 60 ? `${duration / 60} hr` : `${duration} min`;

  return (
    <div className="space-y-5">
      <BackLink href={backHref} label={t("common.back")} />

      <div className="card p-4">
        <div className="flex gap-4">
          <WorkerAvatar id={worker.id} name={worker.name} trade={category} photo={worker.photo} size={64} ring />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">{worker.name}</h1>
            <p className="text-sm text-slate-600">
              {worker.locality} · {t("common.yearsExperience", { n: worker.experienceYears })}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Stars rating={worker.rating} count={worker.jobsCompleted} t={t} />
              {worker.verified && <VerifiedBadge t={t} compact />}
              {isCertified(worker.id) && <CertifiedBadge t={t} />}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">{worker.bio}</p>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-slate-50 p-3">
            <dd className="font-extrabold">{worker.jobsCompleted}</dd>
            <dt className="text-[11px] text-slate-600">{t("wk.jobsDone")}</dt>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dd className="font-extrabold">{money(worker.wage)}</dd>
            <dt className="text-[11px] text-slate-600">{t(priceUnitKey(cat?.priceUnit ?? "per month"))}</dt>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dd className="font-extrabold">{worker.languages.length}</dd>
            <dt className="text-[11px] text-slate-600">{worker.languages.join(", ")}</dt>
          </div>
        </dl>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">{t("hh.worker.skills")}</p>
            <p className="text-sm font-medium">{worker.categories.map((c) => t(`cat.${c}`)).join(" · ")}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-500">{t("hh.worker.availability")}</p>
            <p className="text-sm font-medium">
              {daysLabel(worker.availableDays, t)}, {worker.availableFrom}–{worker.availableTo}
            </p>
          </div>
        </div>
      </div>

      {/* The badge, explained — the core trust story, not a small icon. */}
      <div className="card border-teal-200 bg-teal-50/50 p-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-2xl">
            🛡️
          </span>
          <div>
            <h2 className="font-bold">{t("hh.worker.badgeTitle")}</h2>
            <p className="text-xs text-slate-700">{t("hh.worker.badgeIntro")}</p>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {STEPS.map((s) => {
            const done = rec ? rec[s.key].status === "complete" : false;
            return (
              <li key={s.key} className="flex gap-3 rounded-xl bg-white p-3">
                <span aria-hidden className={done ? "text-teal-700" : "text-slate-400"}>
                  {done ? "✔" : "○"}
                </span>
                <span className="text-sm font-semibold">
                  {t(s.label)}{" "}
                  {!done && <span className="text-xs font-normal text-slate-500">({t("wk.verify.status.pending")})</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-700">{t("hh.worker.badgeWhy")}</p>
        {rec?.insurance.policyNo && (
          <p className="mt-2 text-xs text-slate-600">
            {rec.insurance.policyNo} · {money(rec.insurance.cover ?? 200000)}
          </p>
        )}
      </div>

      {/* Phase 3 skill passport surfaced where the household is choosing. */}
      {(passport.assessments.length > 0 || passport.certifications.length > 0) && (
        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">{t("sp.title")}</h2>
            <PhaseBadge phase={3} t={t} />
          </div>
          <p className="mt-1 text-xs text-slate-600">{t("sp.certifiedExplain")}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {certifiedTrades(worker.id).map((trade) => (
              <li key={trade} className="flex items-center gap-2 rounded-xl bg-indigo-50 p-3">
                <span aria-hidden>🎓</span>
                <span className="font-semibold">{t(`cat.${trade}`)}</span>
                <span className="text-xs text-slate-600">{t("sp.passed")}</span>
              </li>
            ))}
            {passport.certifications.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                <span aria-hidden>📜</span>
                <span className="font-semibold">{c.name}</span>
                <span className="text-xs text-slate-600">
                  {c.issuer} · {c.year}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-600">
            {t("sp.verifiedJobs")}: <strong>{passport.verifiedJobs}</strong> · {t("sp.hours")}:{" "}
            <strong>{passport.hours}</strong>
          </p>
        </div>
      )}

      <section id="book" className="card p-4">
        <h2 className="font-bold">{t("hh.book.title")}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">{t("hh.post.step1")}</dt>
            <dd className="font-semibold">{t(`cat.${category}`)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">{t("hh.book.schedule")}</dt>
            <dd className="text-right font-semibold">
              {type === "one-time" ? fmtDate(date) : `${daysLabel(days, t)} · ${fmtDate(date)}`}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-600">{t("common.time")}</dt>
            <dd className="font-semibold">
              {time} · {durationLabel}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-base">
            <dt className="font-semibold">{t("hh.book.agreedPrice")}</dt>
            <dd className="font-extrabold">
              {money(price)}{" "}
              <span className="text-xs font-normal text-slate-600">{t(priceUnitKey(cat?.priceUnit ?? "per month"))}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-800">{t("hh.book.cancelPolicy")}</p>
          <p className="mt-1">{t("hh.book.cancelPolicyBody")}</p>
        </div>

        <form action={bookWorker} className="mt-3">
          <input type="hidden" name="workerId" value={worker.id} />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="days" value={days.join(",")} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="durationMins" value={duration} />
          <input type="hidden" name="price" value={price} />
          <label className="block text-sm font-semibold" htmlFor="notes">
            {t("hh.book.anythingElse")}
          </label>
          <textarea id="notes" name="notes" rows={2} className="field mt-1" />
          <button className="btn btn-primary mt-3 w-full" disabled={!worker.verified}>
            {worker.verified ? t("hh.worker.bookNow", { name: worker.name.split(" ")[0] }) : t("badge.unverified")}
          </button>
        </form>
      </section>

      <ProtectionPanel covered compact t={t} />

      <section className="space-y-3">
        <h2 className="text-base font-bold">
          {t("hh.worker.reviews")} <span className="font-normal text-slate-500">({reviews.length})</span>
        </h2>
        {reviews.length === 0 && <p className="card p-4 text-sm text-slate-600">{t("hh.worker.noReviews")}</p>}
        <ul className="space-y-3">
          {reviews.slice(0, 8).map((r) => (
            <li key={r.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Avatar name={r.householdName} size={28} />
                  <span className="text-sm font-semibold">{r.householdName}</span>
                </span>
                <Stars rating={r.rating} t={t} />
              </div>
              {r.verifiedJob && (
                <span className="pill mt-2 bg-teal-50 text-teal-800 ring-1 ring-teal-200">✔ {t("hh.worker.verifiedJob")}</span>
              )}
              <p className="mt-2 text-sm text-slate-700">{r.text}</p>
              <p className="mt-2 text-xs text-slate-500">
                {t("hh.booking.quality")} {r.quality} · {t("hh.booking.punctuality")} {r.punctuality} ·{" "}
                {t("hh.booking.professionalism")} {r.professionalism} · {fmtDate(r.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
