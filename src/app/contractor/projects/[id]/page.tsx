import { notFound } from "next/navigation";
import { currentContractor } from "@/lib/session";
import { getWorker } from "@/lib/repo";
import { getProject, projectAssignments, projectGaps, projectWages } from "@/lib/repo-phases";
import { isCertified } from "@/lib/repo-phases";
import { completeProject, rateAssignment, requestOneWorker, requestTeam, siteCheckIn } from "@/lib/actions-phases";
import { getI18n } from "@/i18n/server";
import { BackLink, CertifiedBadge, Section, Stars, VerifiedBadge, daysLabel } from "@/components/ui";
import { PhaseBanner } from "@/components/PhaseBadge";
import { WorkerAvatar } from "@/components/WorkerAvatar";

const STATUS_CLASS: Record<string, string> = {
  planning: "bg-slate-100 text-slate-700",
  hiring: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  running: "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
  completed: "bg-teal-50 text-teal-800 ring-1 ring-teal-200",
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contractor = await currentContractor();
  if (!contractor) return null;
  const project = getProject(id);
  if (!project || project.contractorId !== contractor.id) notFound();

  const { t, money, date: fmtDate } = await getI18n();
  const assignments = projectAssignments(project.id);
  const shortlist = assignments.filter((a) => a.status === "shortlisted");
  const team = assignments.filter((a) => ["requested", "confirmed", "completed"].includes(a.status));
  const gaps = projectGaps(project);
  const wages = projectWages(project.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <BackLink href="/contractor" label={t("ct.nav.projects")} />
      <PhaseBanner phase={2} t={t} />

      <div className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold">{project.name}</h1>
            <p className="text-xs text-slate-600">
              {project.siteAddress} · {fmtDate(project.startDate)} · {project.durationDays} {t("ct.project.duration")} ·{" "}
              {project.hoursFrom}–{project.hoursTo}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              🔁 {t("ct.sharedEngine")} — {daysLabel(project.schedule.days, t)}
            </p>
          </div>
          <span className={`pill ${STATUS_CLASS[project.status]}`}>{t(`ct.project.status.${project.status}`)}</span>
        </div>

        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {gaps.map((g) => (
            <li key={g.trade} className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold">{t(`cat.${g.trade}`)}</p>
              <p className="text-xs text-slate-600">
                {g.filledCount}/{g.count} · {money(g.dailyRate)} {t("common.perDay")}
              </p>
              {g.missing > 0 && (
                <p className="text-xs font-semibold text-amber-700">{t("tp.gaps.workersShort", { n: g.missing })}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {shortlist.length > 0 && (
        <Section
          title={`${t("ct.project.shortlist")} (${shortlist.length})`}
          action={
            <form action={requestTeam}>
              <input type="hidden" name="projectId" value={project.id} />
              <button className="btn btn-primary text-sm">{t("ct.project.requestTeam")}</button>
            </form>
          }
        >
          <p className="text-xs text-slate-600">{t("ct.project.requestTeamSub")}</p>
          <ul className="space-y-2">
            {shortlist.map((a) => {
              const w = getWorker(a.workerId);
              if (!w) return null;
              return (
                <li key={a.id} className="card flex flex-wrap items-center gap-3 p-3">
                  <WorkerAvatar id={w.id} name={w.name} trade={a.trade} photo={w.photo} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{w.name}</span>
                    <span className="block text-xs text-slate-600">
                      {t(`cat.${a.trade}`)} · {w.locality} · {t("common.years", { n: w.experienceYears })}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <Stars rating={w.rating} count={w.jobsCompleted} t={t} />
                      {w.verified && <VerifiedBadge t={t} compact />}
                      {isCertified(w.id) && <CertifiedBadge t={t} />}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-bold">{money(a.dailyRate)}</span>
                    <form action={requestOneWorker} className="mt-1">
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <button className="btn btn-ghost text-xs">{t("ct.project.sendRequest")}</button>
                    </form>
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title={`${t("ct.project.team")} (${team.length})`}>
        {team.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">{t("ct.project.requestTeamSub")}</p>
        ) : (
          <ul className="space-y-3">
            {team.map((a) => {
              const w = getWorker(a.workerId);
              if (!w) return null;
              const checkedInToday = a.attendance.includes(today);
              return (
                <li key={a.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <WorkerAvatar id={w.id} name={w.name} trade={a.trade} photo={w.photo} size={44} ring />
                      <div>
                        <p className="font-semibold">{w.name}</p>
                        <p className="text-xs text-slate-600">
                          {t(`cat.${a.trade}`)} · {w.phone}
                        </p>
                        <span className="mt-1 inline-flex flex-wrap items-center gap-2">
                          <span className="pill bg-slate-100 text-slate-700">
                            {a.status === "requested"
                              ? t("ct.project.requested")
                              : a.status === "confirmed"
                                ? t("ct.project.confirmed")
                                : t("ct.project.completed")}
                          </span>
                          {isCertified(w.id) && <CertifiedBadge t={t} />}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-bold">{money(a.dailyRate * a.attendance.length)}</p>
                      <p className="text-xs text-slate-600">
                        {t("ct.project.daysWorked")}: {a.attendance.length}
                      </p>
                    </div>
                  </div>

                  {a.status === "confirmed" && (
                    <form action={siteCheckIn} className="mt-3">
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <button className="btn btn-ghost w-full" disabled={checkedInToday}>
                        {checkedInToday ? `✔ ${t("ct.project.checkedIn")}` : t("ct.project.checkIn")}
                      </button>
                    </form>
                  )}

                  {a.status === "completed" && (
                    <div className="mt-3 space-y-2">
                      {a.contractorRating ? (
                        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                          ⭐ {a.contractorRating} — {a.contractorReview}
                        </p>
                      ) : (
                        <form action={rateAssignment} className="space-y-2">
                          <input type="hidden" name="assignmentId" value={a.id} />
                          <p className="text-sm font-semibold">{t("ct.project.rateWorkers")}</p>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <label key={n} className="flex-1">
                                <input type="radio" name="rating" value={n} defaultChecked={n === 5} className="peer sr-only" />
                                <span className="block cursor-pointer rounded-xl border border-slate-200 py-2 text-center text-sm font-semibold peer-checked:border-teal-500 peer-checked:bg-teal-50">
                                  {n}★
                                </span>
                              </label>
                            ))}
                          </div>
                          <input name="text" className="field" placeholder={t("hh.booking.reviewText")} />
                          <button className="btn btn-ghost w-full">{t("hh.booking.submitReview")}</button>
                        </form>
                      )}
                      {a.workerReview && (
                        <p className="rounded-xl bg-teal-50 p-3 text-xs text-teal-900">
                          {t("common.worker")}: ⭐ {a.workerRating} — {a.workerReview}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-slate-500">{t("ct.project.checkInNote")}</p>
      </Section>

      <Section title={t("ct.project.payroll")}>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="p-3">{t("common.worker")}</th>
                <th className="p-3">{t("gov.trade")}</th>
                <th className="p-3">{t("ct.project.daysWorked")}</th>
                <th className="p-3">{t("ct.project.rate")}</th>
                <th className="p-3">{t("ct.project.totalWages")}</th>
              </tr>
            </thead>
            <tbody>
              {wages.rows.map((r) => (
                <tr key={r.assignment.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{r.worker?.name}</td>
                  <td className="p-3">{t(`cat.${r.assignment.trade}`)}</td>
                  <td className="p-3">{r.days}</td>
                  <td className="p-3">{money(r.assignment.dailyRate)}</td>
                  <td className="p-3 font-semibold">{money(r.total)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="p-3 font-bold" colSpan={4}>
                  {t("ct.project.totalWages")}
                </td>
                <td className="p-3 font-extrabold">{money(wages.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {project.status !== "completed" && (
        <form action={completeProject}>
          <input type="hidden" name="projectId" value={project.id} />
          <button className="btn btn-dark w-full">{t("ct.project.complete")}</button>
        </form>
      )}
    </div>
  );
}
