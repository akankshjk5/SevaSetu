import { avgVerificationTurnaroundDays, verificationQueue } from "@/lib/repo";
import { db } from "@/lib/store";
import { decideVerification } from "@/lib/actions";
import { getI18n } from "@/i18n/server";

import { WorkerAvatar } from "@/components/WorkerAvatar";

const STEPS = ["govId", "policeCheck", "skillCheck", "insurance"] as const;

export default async function VerificationQueuePage() {
  const { t, money, date: fmtDate } = await getI18n();
  const queue = verificationQueue();
  const recentlyDecided = db()
    .verifications.filter((v) => v.decidedAt && db().workers.find((w) => w.id === v.workerId)?.verified)
    .slice(-6)
    .reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("ad.verify.title")}</h1>
        <p className="text-sm text-slate-600">
          {t("ad.verify.sub")} · {t("ad.turnaround")}: {t("ad.days", { n: avgVerificationTurnaroundDays() })}
        </p>
      </div>

      {queue.length === 0 && (
        <div className="card p-6 text-sm text-slate-600">
          <p className="font-semibold">{t("ad.verify.empty")}</p>
          <p className="mt-1">{t("ad.verify.emptyBody")}</p>
        </div>
      )}

      <ul className="space-y-4">
        {queue.map(({ record, worker, waitingDays }) => (
          <li key={worker.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                <WorkerAvatar id={worker.id} name={worker.name} trade={worker.categories[0]} photo={worker.photo} size={52} />
                <div>
                  <p className="font-bold">{worker.name}</p>
                  <p className="text-xs text-slate-600">
                    {worker.phone} · {worker.locality} · {t("common.years", { n: worker.experienceYears })} ·{" "}
                    {worker.categories.map((c) => t(`cat.${c}`)).join(", ") || t("ad.verify.noTrade")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("ad.verify.submitted", { date: record.submittedAt ? fmtDate(record.submittedAt) : "—" })} ·{" "}
                    {t("ad.verify.waiting", { n: waitingDays })}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold">{t("ad.verify.asking", { amount: money(worker.wage) })}</p>
            </div>

            <ul className="mt-3 grid gap-2 sm:grid-cols-4">
              {STEPS.map((k) => (
                <li key={k} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">{t(`wk.verify.step.${k}`)}</p>
                  <p className="text-sm font-bold">{t(`wk.verify.status.${record[k].status}`)}</p>
                  {k === "govId" && record.govId.docNumberMasked && (
                    <p className="text-[11px] text-slate-600">
                      {record.govId.docType} {record.govId.docNumberMasked}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
              📄 {t("ad.verify.docs")}
            </div>

            <form action={decideVerification} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input type="hidden" name="workerId" value={worker.id} />
              <input name="note" className="field" placeholder={t("ad.verify.reason")} />
              <button name="decision" value="approve" className="btn btn-primary">
                {t("ad.verify.approve")}
              </button>
              <button name="decision" value="reject" className="btn btn-ghost text-rose-700">
                {t("ad.verify.reject")}
              </button>
            </form>
          </li>
        ))}
      </ul>

      <section>
        <h2 className="text-base font-bold">{t("ad.verify.recent")}</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recentlyDecided.map((v) => {
            const w = db().workers.find((x) => x.id === v.workerId)!;
            return (
              <li key={v.workerId} className="card flex items-center gap-3 p-3">
                <WorkerAvatar id={w.id} name={w.name} trade={w.categories[0]} photo={w.photo} size={36} />
                <span>
                  <span className="block text-sm font-semibold">{w.name}</span>
                  <span className="block text-xs text-slate-600">
                    {t("ad.verify.approvedOn", { date: fmtDate(v.decidedAt!) })}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
