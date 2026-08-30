import { db } from "@/lib/store";
import { getWorker } from "@/lib/repo";
import { moderateReview } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { Stars } from "@/components/ui";
import type { Review } from "@/lib/types";
import type { Translate } from "@/i18n";

export default async function ReviewModerationPage() {
  const { t, date: fmtDate } = await getI18n();
  const reviews = db().reviews;
  const flagged = reviews.filter((r) => r.status === "flagged");
  const removed = reviews.filter((r) => r.status === "removed");

  const card = (r: Review, tr: Translate) => (
    <li key={r.id} className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">
            {tr("ad.reviews.by", { worker: getWorker(r.workerId)?.name ?? "—", household: r.householdName })}
          </p>
          <p className="text-xs text-slate-600">{fmtDate(r.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Stars rating={r.rating} t={tr} />
          <span
            className={`pill ${
              r.status === "flagged"
                ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                : r.status === "removed"
                  ? "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
                  : "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
            }`}
          >
            {r.status === "flagged"
              ? tr("ad.reviews.flagged")
              : r.status === "removed"
                ? tr("ad.reviews.removed")
                : tr("ad.reviews.published")}
          </span>
        </div>
      </div>

      <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{r.text}</p>
      {r.moderationNote && <p className="mt-2 text-xs text-slate-500">{r.moderationNote}</p>}

      <form action={moderateReview} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input type="hidden" name="reviewId" value={r.id} />
        <input name="note" className="field" placeholder={tr("ad.reviews.note")} />
        <button name="action" value="remove" className="btn btn-ghost text-rose-700">
          {tr("ad.reviews.remove")}
        </button>
        <button name="action" value="restore" className="btn btn-primary">
          {tr("ad.reviews.restore")}
        </button>
      </form>
    </li>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("ad.reviews.title")}</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold">
          {t("ad.reviews.flagged")} ({flagged.length})
        </h2>
        {flagged.length ? (
          <ul className="space-y-3">{flagged.map((r) => card(r, t))}</ul>
        ) : (
          <p className="card p-6 text-sm text-slate-600">{t("ad.reviews.empty")}</p>
        )}
      </section>

      {removed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold">
            {t("ad.reviews.removed")} ({removed.length})
          </h2>
          <ul className="space-y-3">{removed.map((r) => card(r, t))}</ul>
        </section>
      )}
    </div>
  );
}
