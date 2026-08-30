import { currentWorker } from "@/lib/session";
import { workerEarnings } from "@/lib/repo";
import { getI18n } from "@/i18n/server";

const STEPS = ["step1", "step2", "step3"] as const;

export default async function EarningsPage() {
  const worker = (await currentWorker())!;
  const { t, money, shortDate } = await getI18n();
  const e = workerEarnings(worker.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t("wk.earn.title")}</h1>
        <p className="text-sm text-slate-600">{t("wk.earn.payoutTimeline")}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { k: t("wk.earn.week"), v: e.week },
          { k: t("wk.earn.month"), v: e.month },
          { k: t("wk.earn.lifetime"), v: e.lifetime },
        ].map((s) => (
          <div key={s.k} className="card p-3 text-center">
            <p className="text-lg font-extrabold">{money(s.v)}</p>
            <p className="text-[11px] text-slate-600">{s.k}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h2 className="font-bold">{t("wk.earn.payoutTimeline")}</h2>
        <ol className="mt-3 space-y-3 text-sm">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
              >
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{t(`wk.earn.${s}.t`)}</span>
                <span className="block text-xs text-slate-600">{t(`wk.earn.${s}.d`)}</span>
              </span>
            </li>
          ))}
        </ol>
        {e.pending > 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            {t("wk.earn.onTheWay", { amount: money(e.pending) })}
          </p>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold">{t("wk.earn.jobByJob")}</h2>
        {e.rows.length === 0 && (
          <div className="card p-4 text-sm text-slate-600">
            <p className="font-semibold">{t("wk.earn.noEarnings")}</p>
            <p className="mt-1">{t("wk.earn.noEarningsBody")}</p>
          </div>
        )}
        <ul className="space-y-2">
          {e.rows.slice(0, 30).map(({ booking, payment }) => (
            <li key={payment.id} className="card flex items-center justify-between gap-3 p-3">
              <span>
                <span className="block text-sm font-semibold">{t(`cat.${booking.category}`)}</span>
                <span className="block text-xs text-slate-600">
                  {booking.locality} · {shortDate(booking.completedAt ?? booking.date)} · {payment.method.toUpperCase()}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-bold">{money(payment.workerPayout)}</span>
                <span className="block text-[11px] text-slate-500">
                  {t("wk.earn.outOf", { amount: money(payment.amount) })} · {t(`wk.earn.status.${payment.status}`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
