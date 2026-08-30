import { currentWorker } from "@/lib/session";
import { workerReviews } from "@/lib/repo";
import { getI18n } from "@/i18n/server";
import { Avatar, BackLink, ProgressBar, Stars } from "@/components/ui";

const PARTS = [
  { key: "hh.booking.quality", field: "quality" },
  { key: "hh.booking.punctuality", field: "punctuality" },
  { key: "hh.booking.professionalism", field: "professionalism" },
] as const;

export default async function WorkerReviewsPage() {
  const worker = (await currentWorker())!;
  const { t, date: fmtDate } = await getI18n();
  const reviews = workerReviews(worker.id);
  const avg = (key: "quality" | "punctuality" | "professionalism") =>
    reviews.length ? reviews.reduce((s, r) => s + r[key], 0) / reviews.length : 0;

  return (
    <div className="space-y-5">
      <BackLink href="/worker" label={t("wk.nav.home")} />
      <div>
        <h1 className="text-2xl font-extrabold">{t("wk.reviews.title")}</h1>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-extrabold">{worker.rating ? worker.rating.toFixed(1) : "—"}</p>
            <Stars rating={worker.rating} count={worker.jobsCompleted} t={t} />
          </div>
          <p className="text-right text-sm text-slate-600">
            {t("common.jobs", { n: worker.jobsCompleted })}
          </p>
        </div>

        <dl className="mt-4 space-y-2">
          {PARTS.map((p) => (
            <div key={p.field}>
              <div className="flex justify-between text-xs font-semibold">
                <dt>{t(p.key)}</dt>
                <dd>{avg(p.field).toFixed(1)} / 5</dd>
              </div>
              <ProgressBar value={avg(p.field)} max={5} />
            </div>
          ))}
        </dl>
      </div>

      <ul className="space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Avatar name={r.householdName} size={28} />
                <span className="text-sm font-semibold">{r.householdName}</span>
              </span>
              <Stars rating={r.rating} t={t} />
            </div>
            <p className="mt-2 text-sm text-slate-700">{r.text}</p>
            <p className="mt-1 text-xs text-slate-500">{fmtDate(r.createdAt)}</p>
          </li>
        ))}
        {reviews.length === 0 && (
          <li className="card p-4 text-sm text-slate-600">
            <p className="font-semibold">{t("wk.reviews.none")}</p>
            <p className="mt-1">{t("wk.reviews.noneBody")}</p>
          </li>
        )}
      </ul>
    </div>
  );
}
