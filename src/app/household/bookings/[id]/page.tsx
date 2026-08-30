import Link from "next/link";
import { notFound } from "next/navigation";
import { currentHousehold } from "@/lib/session";
import { getBooking, getPaymentForBooking, getWorker } from "@/lib/repo";
import { db } from "@/lib/store";
import { CATEGORY_MAP, priceUnitKey } from "@/lib/categories";
import {
  cancelBooking,
  payForBooking,
  raiseDispute,
  requestReplacement,
  setBookingStatus,
  submitReview,
  togglePause,
} from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { ProtectionPanel } from "@/components/protection";
import { BackLink, Stars, StatusPill, VerifiedBadge, daysLabel } from "@/components/ui";
import type { BookingStatus } from "@/lib/types";
import { WorkerAvatar } from "@/components/WorkerAvatar";

const TRACK: BookingStatus[] = ["confirmed", "en-route", "arrived", "in-progress", "completed"];
const METHODS = [
  { id: "upi", key: "hh.booking.upi", covered: true },
  { id: "card", key: "hh.booking.card", covered: true },
  { id: "cash", key: "hh.booking.cash", covered: false },
];
const REASONS = ["noshow", "incomplete", "damage", "behaviour", "payment"] as const;
const RATING_FIELDS = [
  { name: "quality", key: "hh.booking.quality" },
  { name: "punctuality", key: "hh.booking.punctuality" },
  { name: "professionalism", key: "hh.booking.professionalism" },
];

export default async function BookingDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; reviewed?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const household = (await currentHousehold())!;
  const booking = getBooking(id);
  if (!booking || booking.householdId !== household.id) notFound();

  const { t, money, date: fmtDate } = await getI18n();
  const worker = getWorker(booking.workerId ?? "");
  const payment = getPaymentForBooking(booking.id);
  const review = booking.reviewId ? db().reviews.find((r) => r.id === booking.reviewId) : null;
  const dispute = db().disputes.find((d) => d.bookingId === booking.id);
  const cat = CATEGORY_MAP[booking.category];
  const trackIndex = TRACK.indexOf(booking.status);
  const firstName = worker?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-5">
      <BackLink href="/household/bookings" label={t("hh.allBookings")} />

      {sp.paid === "1" && (
        <p className="card border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-900">
          {t("hh.booking.paidNote", { name: firstName })}
        </p>
      )}
      {sp.reviewed === "1" && (
        <p className="card border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-900">
          {t("hh.booking.reviewedNote", { name: firstName })}
        </p>
      )}

      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            {worker ? <WorkerAvatar id={worker.id} name={worker.name} trade={booking.category} photo={worker.photo} size={52} ring /> : <span className="text-3xl">🔎</span>}
            <div>
              <h1 className="text-lg font-extrabold">{worker?.name ?? t("hh.findingWorker")}</h1>
              <p className="text-xs text-slate-600">
                {t(`cat.${booking.category}`)} ·{" "}
                {booking.type === "one-time" ? t("hh.type.one-time") : daysLabel(booking.schedule?.days ?? [], t)}
              </p>
              {worker?.verified && (
                <span className="mt-2 inline-block">
                  <VerifiedBadge t={t} compact />
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold">{money(booking.price)}</p>
            <p className="text-[11px] text-slate-600">{t(priceUnitKey(cat.priceUnit))}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill status={booking.status} t={t} />
          {booking.schedule?.paused && (
            <span className="pill bg-slate-100 text-slate-700">{t("hh.booking.planPaused")}</span>
          )}
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">{t("hh.booking.nextVisit")}</dt>
            <dd className="font-semibold">
              {fmtDate(booking.date)} · {booking.time}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">{t("hh.booking.address")}</dt>
            <dd className="text-right font-semibold">{booking.addressLine}</dd>
          </div>
          {booking.notes && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-600">{t("hh.booking.yourNote")}</dt>
              <dd className="text-right">{booking.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {!["cancelled", "declined", "requested"].includes(booking.status) && (
        <div className="card p-4">
          <h2 className="font-bold">{t("hh.booking.track")}</h2>
          <ol className="mt-3 space-y-3">
            {TRACK.map((s, i) => {
              const done = trackIndex >= i;
              return (
                <li key={s} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-brand text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {done ? "✔" : i + 1}
                  </span>
                  <span className={`text-sm ${done ? "font-semibold" : "text-slate-500"}`}>{t(`st.${s}`)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {booking.status === "requested" && (
        <div className="card p-4">
          <h2 className="font-bold">{t("hh.booking.waitingTitle", { name: firstName })}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("hh.booking.waitingBody")}</p>
        </div>
      )}

      {booking.status === "completed" && (
        <div className="card p-4">
          <h2 className="font-bold">{t("hh.booking.payment")}</h2>
          {payment && payment.status !== "pending" ? (
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-semibold text-teal-800">
                {t("hh.booking.paidWith", { amount: money(payment.amount), method: payment.method.toUpperCase() })}
              </p>
              <p className="text-slate-600">{t("hh.booking.reference", { ref: payment.reference })}</p>
              <p className="text-slate-600">
                {t("hh.booking.split", { payout: money(payment.workerPayout), fee: money(payment.platformFee) })}
              </p>
            </div>
          ) : (
            <form action={payForBooking} className="mt-3 space-y-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              <p className="text-sm text-slate-600">{t("hh.booking.chooseMethod")}</p>
              <div className="space-y-2">
                {METHODS.map((m, i) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <input type="radio" name="method" value={m.id} defaultChecked={i === 0} className="h-5 w-5" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{t(m.key)}</span>
                      <span className="block text-xs text-slate-600">{t(`${m.key}.sub`)}</span>
                    </span>
                    <span className={`pill ${m.covered ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                      {m.covered ? t("hh.booking.protected") : t("hh.booking.notProtected")}
                    </span>
                  </label>
                ))}
              </div>
              <button className="btn btn-primary w-full">{t("hh.booking.payTitle", { amount: money(booking.price) })}</button>
              <p className="text-center text-xs text-slate-500">{t("hh.booking.mockNote")}</p>
            </form>
          )}
        </div>
      )}

      {booking.status === "completed" && (
        <div id="review" className="card p-4">
          <h2 className="font-bold">{t("hh.booking.rateTitle")}</h2>
          {review ? (
            <div className="mt-2">
              <Stars rating={review.rating} t={t} />
              <p className="mt-2 text-sm text-slate-700">{review.text}</p>
              <p className="mt-1 text-xs text-slate-500">
                {t("hh.booking.reviewPosted", { date: fmtDate(review.createdAt) })}
              </p>
            </div>
          ) : (
            <form action={submitReview} className="mt-3 space-y-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              {RATING_FIELDS.map((f) => (
                <div key={f.name}>
                  <p className="text-sm font-semibold">{t(f.key)}</p>
                  <div className="mt-1 flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="flex-1">
                        <input type="radio" name={f.name} value={n} defaultChecked={n === 5} className="peer sr-only" />
                        <span className="block cursor-pointer rounded-xl border border-slate-200 py-2 text-center text-sm font-semibold peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-900">
                          {n}★
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <textarea name="text" rows={3} className="field" placeholder={t("hh.booking.reviewText")} />
              <button className="btn btn-primary w-full">{t("hh.booking.submitReview")}</button>
            </form>
          )}
        </div>
      )}

      <ProtectionPanel covered={booking.onPlatformPayment} t={t} />

      <div className="card space-y-3 p-4">
        <h2 className="font-bold">{t("hh.booking.manage")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {booking.schedule && (
            <form action={togglePause}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <button className="btn btn-ghost w-full">
                {booking.schedule.paused ? t("hh.booking.resume") : t("hh.booking.pause")}
              </button>
            </form>
          )}
          {["confirmed", "requested", "en-route"].includes(booking.status) && (
            <>
              <form action={requestReplacement}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button className="btn btn-ghost w-full">{t("hh.booking.replacement")}</button>
              </form>
              <form action={cancelBooking}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button className="btn btn-ghost w-full text-rose-700">{t("hh.booking.cancel")}</button>
              </form>
            </>
          )}
          {worker && (
            <Link href={`/household/workers/${worker.id}`} data-tap className="btn btn-ghost w-full">
              {t("hh.booking.viewProfile")}
            </Link>
          )}
        </div>

        {dispute ? (
          <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            {t("hh.booking.disputeRaised", { date: fmtDate(dispute.createdAt) })} —{" "}
            {dispute.status === "open" ? t("hh.booking.disputeOpen") : dispute.resolution}
          </p>
        ) : (
          <details className="rounded-xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold">{t("hh.booking.somethingWrong")}</summary>
            <form action={raiseDispute} className="mt-3 space-y-2">
              <input type="hidden" name="bookingId" value={booking.id} />
              <select name="reason" className="field">
                {REASONS.map((r) => (
                  <option key={r} value={t(`hh.booking.reason.${r}`)}>
                    {t(`hh.booking.reason.${r}`)}
                  </option>
                ))}
              </select>
              <textarea name="detail" rows={2} className="field" placeholder={t("hh.booking.tellUs")} required />
              <button className="btn btn-dark w-full">{t("hh.booking.raiseSupport")}</button>
            </form>
          </details>
        )}
      </div>

      {/* Demo controls so a reviewer can walk the whole flow without a second login. */}
      <div className="card border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">{t("hh.booking.demoControls")}</p>
        <p className="mt-1 text-xs text-slate-600">{t("hh.booking.demoControlsSub")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRACK.map((s) => (
            <form key={s} action={setBookingStatus}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <input type="hidden" name="status" value={s} />
              <button className="pill bg-white text-slate-700 ring-1 ring-slate-300">
                {t("hh.booking.markAs", { status: t(`st.${s}`) })}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
