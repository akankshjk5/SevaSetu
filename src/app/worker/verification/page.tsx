import { currentWorker } from "@/lib/session";
import { verificationFor } from "@/lib/repo";
import { submitVerificationStep } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { ProgressBar } from "@/components/ui";
import type { VerificationStepStatus } from "@/lib/types";

const STATUS_CLASS: Record<VerificationStepStatus, string> = {
  "not-started": "bg-slate-100 text-slate-700",
  pending: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  complete: "bg-teal-50 text-teal-800 ring-1 ring-teal-200",
  rejected: "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
};

const STEPS = ["govId", "policeCheck", "skillCheck", "insurance"] as const;

export default async function VerificationPage() {
  const worker = await currentWorker();
  if (!worker) return null;
  const rec = verificationFor(worker.id);
  if (!rec) return null;
  const { t, money } = await getI18n();
  const done = STEPS.filter((s) => rec[s].status === "complete").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t("wk.verify.title")}</h1>
        <p className="text-sm text-slate-600">{t("wk.verify.sub")}</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{t("wk.verify.progress", { done })}</span>
          <span className={worker.verified ? "text-teal-700" : "text-amber-700"}>
            {worker.verified ? `✔ ${t("badge.verified.short")}` : t("wk.verify.status.pending")}
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar value={done} max={4} tone={worker.verified ? "brand" : "amber"} />
        </div>
      </div>

      {worker.verified && (
        <div className="card border-teal-200 bg-teal-50 p-4">
          <p className="font-bold">{t("wk.verify.done.title")}</p>
          <p className="mt-1 text-sm text-slate-700">{t("wk.verify.done.body")}</p>
        </div>
      )}

      <ol className="space-y-3">
        {STEPS.map((key, i) => {
          const state = rec[key].status;
          return (
            <li key={key} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      state === "complete" ? "bg-brand text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {state === "complete" ? "✔" : i + 1}
                  </span>
                  <div>
                    <p className="font-bold">{t(`wk.verify.step.${key}`)}</p>
                    <p className="text-sm text-slate-600">{t(`wk.verify.why.${key}`)}</p>
                  </div>
                </div>
                <span className={`pill shrink-0 ${STATUS_CLASS[state]}`}>{t(`wk.verify.status.${state}`)}</span>
              </div>

              {key === "govId" && state !== "complete" && (
                <form action={submitVerificationStep} className="mt-3 space-y-2">
                  <input type="hidden" name="step" value="govId" />
                  <label className="block text-sm font-semibold">
                    {t("wk.verify.docType")}
                    <select name="docType" className="field mt-1">
                      <option>Aadhaar</option>
                      <option>Voter ID</option>
                      <option>Driving licence</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">
                    {t("wk.verify.docNumber")}
                    <input name="docNumber" inputMode="numeric" className="field mt-1" required />
                  </label>
                  <label className="btn btn-ghost inline-flex w-full cursor-pointer">
                    📷 {t("wk.verify.upload")}
                    <input type="file" accept="image/*" className="sr-only" />
                  </label>
                  <button className="btn btn-primary w-full">{t("wk.verify.submit")}</button>
                </form>
              )}
              {key === "govId" && rec.govId.docNumberMasked && (
                <p className="mt-2 text-xs text-slate-600">
                  {rec.govId.docType} {rec.govId.docNumberMasked}
                </p>
              )}

              {key === "policeCheck" && state === "not-started" && (
                <form action={submitVerificationStep} className="mt-3">
                  <input type="hidden" name="step" value="policeCheck" />
                  <button className="btn btn-primary w-full">{t("wk.verify.request")}</button>
                </form>
              )}

              {key === "skillCheck" && state === "not-started" && (
                <form action={submitVerificationStep} className="mt-3">
                  <input type="hidden" name="step" value="skillCheck" />
                  <button className="btn btn-primary w-full">{t("wk.verify.request")}</button>
                </form>
              )}
              {key === "skillCheck" && rec.skillCheck.assessor && (
                <p className="mt-2 text-xs text-slate-600">{rec.skillCheck.assessor}</p>
              )}

              {key === "insurance" && state !== "complete" && (
                <form action={submitVerificationStep} className="mt-3">
                  <input type="hidden" name="step" value="insurance" />
                  <button className="btn btn-primary w-full">{t("wk.verify.enrol")}</button>
                </form>
              )}
              {key === "insurance" && rec.insurance.policyNo && (
                <p className="mt-2 text-xs text-slate-600">
                  {rec.insurance.policyNo} · {money(rec.insurance.cover ?? 200000)}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {rec.reviewerNote && <p className="card bg-slate-50 p-4 text-sm">{rec.reviewerNote}</p>}
    </div>
  );
}
