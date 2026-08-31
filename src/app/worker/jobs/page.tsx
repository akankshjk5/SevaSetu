import Link from "next/link";
import { currentWorker } from "@/lib/session";
import { getHousehold, workerBookings } from "@/lib/repo";
import { getContractor, getProject, workerAssignments } from "@/lib/repo-phases";
import { respondToAssignment, siteCheckIn } from "@/lib/actions-phases";
import { getI18n } from "@/i18n/server";
import { Avatar, EmptyState, Section, StatusPill } from "@/components/ui";
import { PhaseBadge } from "@/components/PhaseBadge";
import { CATEGORY_MAP } from "@/lib/categories";

export default async function WorkerJobsPage() {
  const worker = (await currentWorker())!;
  const { t, money, shortDate } = await getI18n();

  const all = workerBookings(worker.id);
  const requests = all.filter((b) => b.status === "requested");
  const upcoming = all.filter((b) => ["confirmed", "en-route", "arrived", "in-progress"].includes(b.status));
  const past = all.filter((b) => ["completed", "cancelled", "declined"].includes(b.status));

  const assignments = workerAssignments(worker.id).filter((a) => a.status !== "shortlisted");
  const today = new Date().toISOString().slice(0, 10);

  const row = (b: (typeof all)[number]) => {
    const household = getHousehold(b.householdId);
    return (
      <li key={b.id}>
        <Link href={`/worker/jobs/${b.id}`} className="card flex items-center gap-3 p-4">
          {/* Who booked you comes first: a face and a name, not a category. */}
          <Avatar name={household?.name ?? "?"} size={44} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-bold">{household?.name}</span>
              <span className="text-lg font-extrabold text-brand">{money(b.price)}</span>
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-sm">
              <span aria-hidden>{CATEGORY_MAP[b.category].icon}</span>
              <span className="font-semibold">{t(`cat.${b.category}`)}</span>
            </span>
            <span className="block text-xs text-slate-600">
              {b.locality} · {shortDate(b.date)} · {b.time}
            </span>
            <span className="mt-2 block">
              <StatusPill status={b.status} t={t} />
            </span>
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">{t("wk.jobs.title")}</h1>

      <Section title={`${t("wk.jobs.new")} (${requests.length})`}>
        {requests.length ? (
          <ul className="space-y-3">{requests.map(row)}</ul>
        ) : (
          <p className="card p-4 text-sm text-slate-600">{t("wk.noRequests")}</p>
        )}
      </Section>

      <Section title={`${t("wk.jobs.active")} (${upcoming.length})`}>
        {upcoming.length ? (
          <ul className="space-y-3">{upcoming.map(row)}</ul>
        ) : (
          <EmptyState title={t("wk.noRequests")} body={t("wk.noRequestsBody")} />
        )}
      </Section>

      {/* Phase 2 — site projects, with the demo stand-in for geofence check-in. */}
      {assignments.length > 0 && (
        <Section title={t("ct.title")} action={<PhaseBadge phase={2} t={t} />}>
          <ul className="space-y-3">
            {assignments.map((a) => {
              const p = getProject(a.projectId);
              const contractor = getContractor(p?.contractorId ?? "");
              const checkedInToday = a.attendance.includes(today);
              return (
                <li key={a.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{p?.name}</p>
                      <p className="text-xs text-slate-600">
                        {contractor?.companyName} · {t(`cat.${a.trade}`)} · {p?.siteAddress}
                      </p>
                      <p className="text-xs text-slate-600">
                        {p?.hoursFrom}–{p?.hoursTo} · {t("ct.project.daysWorked")}: {a.attendance.length}
                      </p>
                    </div>
                    <p className="text-right font-extrabold">
                      {money(a.dailyRate)}
                      <span className="block text-[11px] font-normal text-slate-600">{t("common.perDay")}</span>
                    </p>
                  </div>

                  <p className="mt-2">
                    <span className="pill bg-slate-100 text-slate-700">{t(`ct.project.${a.status === "requested" ? "requested" : a.status === "confirmed" ? "confirmed" : "completed"}`)}</span>
                  </p>

                  {a.status === "requested" && (
                    <div className="mt-3 flex gap-2">
                      <form action={respondToAssignment} className="flex-1">
                        <input type="hidden" name="assignmentId" value={a.id} />
                        <input type="hidden" name="accept" value="no" />
                        <button className="btn btn-ghost w-full">{t("wk.decline")}</button>
                      </form>
                      <form action={respondToAssignment} className="flex-1">
                        <input type="hidden" name="assignmentId" value={a.id} />
                        <input type="hidden" name="accept" value="yes" />
                        <button className="btn btn-primary w-full">{t("wk.accept")}</button>
                      </form>
                    </div>
                  )}

                  {a.status === "confirmed" && (
                    <form action={siteCheckIn} className="mt-3">
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <button className="btn btn-primary w-full" disabled={checkedInToday}>
                        {checkedInToday ? `✔ ${t("ct.project.checkedIn")}` : t("ct.project.checkIn")}
                      </button>
                      <p className="mt-2 text-center text-xs text-slate-500">{t("ct.project.checkInNote")}</p>
                    </form>
                  )}

                  {a.status === "completed" && a.contractorReview && (
                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                      “{a.contractorReview}” — {contractor?.companyName}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section title={`${t("wk.jobs.done")} (${past.length})`}>
        {past.length ? (
          <ul className="space-y-3">{past.slice(0, 30).map(row)}</ul>
        ) : (
          <p className="card p-4 text-sm text-slate-600">{t("wk.earn.noEarnings")}</p>
        )}
      </Section>
    </div>
  );
}
