import { notFound } from "next/navigation";
import { currentWorker } from "@/lib/session";
import { getBooking, getHousehold, getPaymentForBooking } from "@/lib/repo";
import { raiseDispute, respondToJob, setBookingStatus } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { BackLink, StatusPill, daysLabel } from "@/components/ui";
import { JobFactCard } from "@/components/JobFactCard";
import { CATEGORY_MAP } from "@/lib/categories";

const UPDATES = [
  { s: "en-route", key: "wk.onMyWay" },
  { s: "arrived", key: "wk.arrived" },
  { s: "in-progress", key: "wk.startJob" },
  { s: "completed", key: "wk.completeJob" },
];
const REASONS = ["payment", "notHome", "different", "behaviour"] as const;

export default async function WorkerJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const worker = await currentWorker();
  if (!worker) return null;
  const b = getBooking(id);
  if (!b || b.workerId !== worker.id) notFound();

  const { t, money, date: fmtDate } = await getI18n();
  const household = getHousehold(b.householdId);
  const payment = getPaymentForBooking(b.id);

  return (
    <div className="space-y-5">
      <BackLink href="/worker/jobs" label={t("wk.jobs.title")} />

      {/* The five facts first, icon-led and readable aloud — a worker who
          reads little should still know who called them and for how much. */}
      <JobFactCard
        t={t}
        facts={{
          whoName: household?.name ?? "",
          whoSub: `${b.locality}`,
          what: t(`cat.${b.category}`),
          whatIcon: CATEGORY_MAP[b.category].icon,
          when: `${fmtDate(b.date)}, ${b.time}`,
          where: b.addressLine,
          amount: money(b.price),
          amountSub: t("wk.jobs.afterFee"),
        }}
      />

      {b.notifiedAt && (
        <p className="flex items-center gap-2 rounded-xl bg-[#e7f7ee] px-4 py-3 text-sm font-semibold text-teal-900">
          <span aria-hidden>💬</span> {t("wa.yourCard")}
        </p>
      )}

      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold">{t(`cat.${b.category}`)}</h1>
            <p className="text-xs text-slate-600">
              {b.type === "one-time" ? t("hh.type.one-time") : daysLabel(b.schedule?.days ?? [], t)} ·{" "}
              {b.durationMins >= 60 ? `${b.durationMins / 60} hr` : `${b.durationMins} min`}
            </p>
          </div>
          <p className="text-xl font-extrabold">{money(b.price)}</p>
        </div>
        <div className="mt-3">
          <StatusPill status={b.status} t={t} />
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">{t("common.date")}</dt>
            <dd className="font-semibold">
              {fmtDate(b.date)} · {b.time}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">{t("wk.jobs.address")}</dt>
            <dd className="text-right font-semibold">{b.addressLine}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">{t("wk.jobs.family")}</dt>
            <dd className="font-semibold">{household?.name}</dd>
          </div>
          {b.notes && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">{t("common.notes")}</dt>
              <dd className="text-right">{b.notes}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 h-32 rounded-xl bg-teal-50/40 bg-[length:24px_24px] bg-[linear-gradient(0deg,#eef2f6_1px,transparent_1px),linear-gradient(90deg,#eef2f6_1px,transparent_1px)]">
          <p className="flex h-full items-center justify-center text-sm font-semibold text-slate-600">
            📍 {b.locality}
          </p>
        </div>
      </div>

      {b.status === "requested" && (
        <div className="flex gap-2">
          <form action={respondToJob} className="flex-1">
            <input type="hidden" name="bookingId" value={b.id} />
            <input type="hidden" name="accept" value="no" />
            <button className="btn btn-ghost w-full">{t("wk.decline")}</button>
          </form>
          <form action={respondToJob} className="flex-1">
            <input type="hidden" name="bookingId" value={b.id} />
            <input type="hidden" name="accept" value="yes" />
            <button className="btn btn-primary w-full">{t("wk.accept")}</button>
          </form>
        </div>
      )}

      {["confirmed", "en-route", "arrived", "in-progress"].includes(b.status) && (
        <div className="card space-y-2 p-4">
          <h2 className="font-bold">{t("wk.jobs.update")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {UPDATES.map((a) => (
              <form key={a.s} action={setBookingStatus}>
                <input type="hidden" name="bookingId" value={b.id} />
                <input type="hidden" name="status" value={a.s} />
                <button className={`btn w-full ${a.s === "completed" ? "btn-primary" : "btn-ghost"}`}>{t(a.key)}</button>
              </form>
            ))}
          </div>
        </div>
      )}

      {b.status === "completed" && (
        <div className="card p-4">
          <h2 className="font-bold">{t("hh.booking.payment")}</h2>
          {payment && payment.status !== "pending" ? (
            <p className="mt-1 text-sm text-teal-800">
              {t("wk.jobs.paidYou", {
                amount: money(payment.workerPayout),
                method: payment.method.toUpperCase(),
                date: fmtDate(payment.paidAt ?? b.completedAt ?? b.date),
              })}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              {t("wk.jobs.waitingPayment", { amount: money(Math.round(b.price * 0.88)) })}
            </p>
          )}
        </div>
      )}

      <details className="card p-4">
        <summary className="cursor-pointer font-semibold">{t("wk.jobs.problem")}</summary>
        <form action={raiseDispute} className="mt-3 space-y-2">
          <input type="hidden" name="bookingId" value={b.id} />
          <select name="reason" className="field">
            {REASONS.map((r) => (
              <option key={r} value={t(`wk.jobs.reason.${r}`)}>
                {t(`wk.jobs.reason.${r}`)}
              </option>
            ))}
          </select>
          <textarea name="detail" rows={2} className="field" placeholder={t("hh.booking.tellUs")} required />
          <button className="btn btn-dark w-full">{t("hh.booking.raiseSupport")}</button>
        </form>
      </details>
    </div>
  );
}
