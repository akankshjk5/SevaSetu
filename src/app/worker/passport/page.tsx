import { currentWorker } from "@/lib/session";
import { listingsForTrades, skillPassport } from "@/lib/repo-phases";
import { addCertification, schedulePractical } from "@/lib/actions-phases";
import { PRACTICAL_TRADES, QUIZZES } from "@/lib/quiz";
import { getI18n } from "@/i18n/server";
import { CertifiedBadge, Section } from "@/components/ui";
import { PhaseBadge, PhaseBanner } from "@/components/PhaseBadge";
import { SkillQuiz } from "./SkillQuiz";

export default async function PassportPage({ searchParams }: { searchParams: Promise<{ score?: string }> }) {
  const sp = await searchParams;
  const worker = (await currentWorker())!;
  const { t, money, date: fmtDate } = await getI18n();

  const passport = skillPassport(worker);
  const listings = listingsForTrades(worker.categories);
  const certified = passport.assessments.some((a) => a.status === "passed");
  const score = sp.score ? Number(sp.score) : null;

  return (
    <div className="space-y-6">
      <PhaseBanner phase={3} t={t} />

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-extrabold">{t("sp.title")}</h1>
          <PhaseBadge phase={3} t={t} />
          {certified && <CertifiedBadge t={t} />}
        </div>
        <p className="text-sm text-slate-600">{t("sp.sub")}</p>
      </div>

      {score !== null && (
        <p
          className={`card p-3 text-sm font-semibold ${
            score >= 70 ? "border-teal-200 bg-teal-50 text-teal-900" : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {t("sp.quiz.result", { score })} — {score >= 70 ? t("sp.quiz.passNote") : t("sp.quiz.failNote")}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { k: t("sp.verifiedJobs"), v: passport.verifiedJobs },
          { k: t("sp.hours"), v: passport.hours },
          { k: t("sp.trades"), v: passport.trades.length },
        ].map((s) => (
          <div key={s.k} className="card p-3 text-center">
            <p className="text-lg font-extrabold">{s.v}</p>
            <p className="text-[11px] text-slate-600">{s.k}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">{t("sp.since", { date: fmtDate(worker.joinedAt) })}</p>

      {/* Skill checks: quiz for most trades, practical for the risky ones. */}
      <Section title={t("sp.assessments")}>
        <ul className="space-y-3">
          {worker.categories.map((trade) => {
            const record = passport.assessments.find((a) => a.trade === trade);
            const needsPractical = PRACTICAL_TRADES.includes(trade);
            const questions = QUIZZES[trade];
            return (
              <li key={trade} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{t(`cat.${trade}`)}</p>
                  {record ? (
                    <span
                      className={`pill ${
                        record.status === "passed"
                          ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
                          : record.status === "scheduled"
                            ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                            : "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
                      }`}
                    >
                      {record.status === "passed"
                        ? t("sp.passed")
                        : record.status === "scheduled"
                          ? t("sp.practicalBooked")
                          : t("sp.failed")}
                    </span>
                  ) : (
                    <span className="pill bg-slate-100 text-slate-700">{t("wk.verify.status.not-started")}</span>
                  )}
                </div>

                {record?.score !== undefined && (
                  <p className="mt-1 text-xs text-slate-600">{t("sp.score", { score: record.score })}</p>
                )}
                {record?.scheduledFor && (
                  <p className="mt-1 text-xs text-slate-600">
                    {record.centre} · {fmtDate(record.scheduledFor)}
                  </p>
                )}

                {needsPractical ? (
                  <div className="mt-3">
                    <p className="text-xs text-slate-600">{t("sp.practicalNote")}</p>
                    {record?.status !== "scheduled" && record?.status !== "passed" && (
                      <form action={schedulePractical} className="mt-2">
                        <input type="hidden" name="trade" value={trade} />
                        <button className="btn btn-primary w-full">{t("sp.takeTest")}</button>
                      </form>
                    )}
                  </div>
                ) : questions ? (
                  <div className="mt-3">
                    <SkillQuiz trade={trade} questions={questions} />
                  </div>
                ) : null}
              </li>
            );
          })}
          {worker.categories.length === 0 && (
            <li className="card p-4 text-sm text-slate-600">{t("wk.profile.sub")}</li>
          )}
        </ul>
      </Section>

      <Section title={t("sp.history")}>
        <p className="text-xs text-slate-600">{t("sp.historyNote")}</p>
        <ul className="space-y-2">
          {passport.entries.slice(0, 15).map((e, i) => (
            <li key={`${e.date}-${i}`} className="card flex items-center justify-between gap-3 p-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {e.kind === "site" ? e.title : t(`cat.${e.trade}`)}
                </span>
                <span className="block text-xs text-slate-600">
                  {t(`cat.${e.trade}`)} · {e.counterparty} · {e.date ? fmtDate(e.date) : ""}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-bold">{money(e.amount)}</span>
                <span className="block text-[11px] text-slate-500">{e.hours} hr</span>
              </span>
            </li>
          ))}
          {passport.entries.length === 0 && (
            <li className="card p-4 text-sm text-slate-600">{t("wk.earn.noEarningsBody")}</li>
          )}
        </ul>
      </Section>

      <Section title={t("sp.certs")}>
        <ul className="space-y-2">
          {passport.certifications.map((c) => (
            <li key={c.id} className="card flex items-center justify-between gap-3 p-3">
              <span>
                <span className="block text-sm font-semibold">{c.name}</span>
                <span className="block text-xs text-slate-600">
                  {c.issuer} · {c.year}
                </span>
              </span>
              <span className={`pill ${c.verified ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                {c.verified ? t("badge.verified.short") : t("wk.verify.status.pending")}
              </span>
            </li>
          ))}
        </ul>
        <form action={addCertification} className="card space-y-2 p-4">
          <p className="text-sm font-semibold">{t("sp.addCert")}</p>
          <input name="name" placeholder={t("sp.certName")} className="field" required />
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="issuer" placeholder={t("sp.certIssuer")} className="field" />
            <input name="year" type="number" placeholder={t("sp.certYear")} className="field" />
          </div>
          <button className="btn btn-ghost w-full">{t("sp.upload")}</button>
        </form>
      </Section>

      <Section title={t("sp.training")}>
        {listings.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">{t("sp.noTraining")}</p>
        ) : (
          <ul className="space-y-2">
            {listings.map((l) => (
              <li key={l.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{l.title}</p>
                    <p className="text-xs text-slate-600">
                      {l.providerName} · {l.district} · {l.durationDays} {t("tp.course.days")}
                    </p>
                  </div>
                  <span className="pill bg-teal-50 text-teal-800">{l.fee === 0 ? t("tp.course.free") : money(l.fee)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{l.about}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
