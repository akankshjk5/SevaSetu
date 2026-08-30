import { db } from "@/lib/store";
import { getBooking, getHousehold, getWorker } from "@/lib/repo";
import { addDisputeNote, resolveDispute } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import type { Dispute } from "@/lib/types";
import type { Translate } from "@/i18n";

const RESOLUTIONS = ["res1", "res2", "res3", "res4", "res5"] as const;

export default async function DisputesPage() {
  const { t, money, date: fmtDate } = await getI18n();
  const disputes = db().disputes.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = disputes.filter((d) => d.status === "open");
  const closed = disputes.filter((d) => d.status === "resolved");

  const card = (d: Dispute, tr: Translate) => {
    const b = getBooking(d.bookingId);
    const worker = b ? getWorker(b.workerId ?? "") : null;
    const household = b ? getHousehold(b.householdId) : null;
    return (
      <li key={d.id} className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-bold">{d.reason}</p>
            <p className="text-xs text-slate-600">
              {tr("ad.disputes.raisedBy", { name: d.raisedByName })} · {tr(`role.${d.raisedBy === "worker" ? "worker" : "household"}`)} ·{" "}
              {fmtDate(d.createdAt)}
            </p>
          </div>
          <span
            className={`pill ${
              d.status === "open"
                ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                : "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
            }`}
          >
            {d.status === "open" ? tr("ad.disputes.open") : tr("ad.disputes.resolved")}
          </span>
        </div>

        <p className="mt-2 text-sm text-slate-700">{d.detail}</p>

        {b && (
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-2">
              <dt className="text-slate-500">{tr("hh.post.step1")}</dt>
              <dd className="font-semibold">{tr(`cat.${b.category}`)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <dt className="text-slate-500">{tr("common.worker")}</dt>
              <dd className="font-semibold">{worker?.name ?? "—"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <dt className="text-slate-500">{tr("common.household")}</dt>
              <dd className="font-semibold">{household?.name ?? "—"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-2">
              <dt className="text-slate-500">{tr("common.price")}</dt>
              <dd className="font-semibold">{money(b.price)}</dd>
            </div>
          </dl>
        )}

        {d.notes.length > 0 && (
          <ul className="mt-3 space-y-2 border-l-2 border-slate-200 pl-3">
            {d.notes.map((n, i) => (
              <li key={i} className="text-xs">
                <span className="font-semibold">{n.by}</span> <span className="text-slate-500">· {fmtDate(n.at)}</span>
                <p className="text-slate-700">{n.text}</p>
              </li>
            ))}
          </ul>
        )}

        {d.status === "open" ? (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            <form action={addDisputeNote} className="flex gap-2">
              <input type="hidden" name="disputeId" value={d.id} />
              <input name="note" className="field" placeholder={tr("ad.disputes.addNote")} required />
              <button className="btn btn-ghost">{tr("ad.disputes.addNote")}</button>
            </form>
            <form action={resolveDispute} className="flex gap-2">
              <input type="hidden" name="disputeId" value={d.id} />
              <select name="resolution" className="field">
                {RESOLUTIONS.map((r) => (
                  <option key={r} value={tr(`ad.disputes.${r}`)}>
                    {tr(`ad.disputes.${r}`)}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary">{tr("ad.disputes.resolve")}</button>
            </form>
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-teal-50 p-3 text-xs text-teal-900">
            <span className="font-semibold">{tr("ad.disputes.resolution.label")}: </span>
            {d.resolution}
          </p>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("ad.disputes.title")}</h1>
        <p className="text-sm text-slate-600">{t("ad.disputes.count", { open: open.length, closed: closed.length })}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold">{t("ad.disputes.open")}</h2>
        {open.length ? (
          <ul className="space-y-3">{open.map((d) => card(d, t))}</ul>
        ) : (
          <p className="card p-6 text-sm text-slate-600">{t("ad.disputes.empty")}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">{t("ad.disputes.resolved")}</h2>
        <ul className="space-y-3">{closed.map((d) => card(d, t))}</ul>
      </section>
    </div>
  );
}
