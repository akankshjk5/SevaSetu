import Link from "next/link";
import { currentWorker } from "@/lib/session";
import { getHousehold, verificationFor, workerBookings, workerEarnings, workerReviews } from "@/lib/repo";
import { workerAssignments, getProject } from "@/lib/repo-phases";
import { respondToJob, setBookingStatus } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { EmptyState, Section, StatusPill, Stars, daysLabel } from "@/components/ui";
import { PhaseBadge } from "@/components/PhaseBadge";

const STEPS = ["govId", "policeCheck", "skillCheck", "insurance"] as const;

export default async function WorkerHome() {
  const worker = (await currentWorker())!;
  const { t, money, shortDate } = await getI18n();

  const rec = verificationFor(worker.id);
  const done = rec ? STEPS.filter((s) => rec[s].status === "complete").length : 0;
  const bookings = workerBookings(worker.id);
  const requests = bookings.filter((b) => b.status === "requested");
  const today = new Date().toISOString().slice(0, 10);
  const active = bookings.filter((b) => ["confirmed", "en-route", "arrived", "in-progress"].includes(b.status));
  const earnings = workerEarnings(worker.id);
  const reviews = workerReviews(worker.id);
  const siteRequests = workerAssignments(worker.id).filter((a) => a.status === "requested");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("wk.hello", { name: worker.name.split(" ")[0] })}</h1>
        <p className="text-sm text-slate-600">{worker.verified ? t("wk.verify.done.body") : t("wk.verify.sub")}</p>
      </div>

      {!worker.verified && (
        <div className="card border-amber-200 bg-amber-50 p-4">
          <p className="font-bold">{t("wk.verify.progress", { done })}</p>
          <p className="mt-1 text-sm text-slate-700">{t("wk.verify.sub")}</p>
          <Link href="/worker/verification" data-tap className="btn btn-dark mt-3">
            {t("wk.verify.title")}
          </Link>
        </div>
      )}

      {worker.categories.length === 0 && (
        <div className="card border-teal-200 bg-teal-50 p-4">
          <p className="font-bold">{t("wk.profile.title")}</p>
          <p className="mt-1 text-sm text-slate-700">{t("wk.profile.sub")}</p>
          <Link href="/worker/profile" data-tap className="btn btn-primary mt-3">
            {t("wk.profile.saveNext")}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {[
          { k: t("wk.thisWeek"), v: money(earnings.week) },
          { k: t("wk.jobsDone"), v: worker.jobsCompleted },
          { k: t("wk.rating"), v: worker.rating ? `${worker.rating.toFixed(1)}★` : "—" },
        ].map((s) => (
          <div key={s.k} className="card p-3 text-center">
            <p className="text-lg font-extrabold">{s.v}</p>
            <p className="text-[11px] text-slate-600">{s.k}</p>
          </div>
        ))}
      </div>

      <Section title={`${t("wk.newRequests")} (${requests.length})`}>
        {requests.length === 0 ? (
          <p className="card p-4 text-sm text-slate-600">{t("wk.noRequestsBody")}</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((b) => {
              const h = getHousehold(b.householdId);
              return (
                <li key={b.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{t(`cat.${b.category}`)}</p>
                      <p className="text-xs text-slate-600">
                        {b.locality} · {shortDate(b.date)} · {b.time} ·{" "}
                        {b.durationMins >= 60 ? `${b.durationMins / 60} hr` : `${b.durationMins} min`}
                      </p>
                      <p className="text-xs text-slate-600">
                        {b.type === "one-time" ? t("hh.type.one-time") : daysLabel(b.schedule?.days ?? [], t)}
                      </p>
                    </div>
                    <p className="text-lg font-extrabold">{money(b.price)}</p>
                  </div>
                  {b.notes && <p className="mt-2 rounded-xl bg-slate-50 p-2 text-xs text-slate-700">{b.notes}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    {t("common.household")}: {h?.name}
                  </p>
                  <div className="mt-3 flex gap-2">
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
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Phase 2 site work reaches the same inbox. */}
      {siteRequests.length > 0 && (
        <Section
          title={t("ct.title")}
          action={<PhaseBadge phase={2} t={t} />}
        >
          <ul className="space-y-3">
            {siteRequests.map((a) => {
              const p = getProject(a.projectId);
              return (
                <li key={a.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{p?.name}</p>
                      <p className="text-xs text-slate-600">
                        {t(`cat.${a.trade}`)} · {p?.district} · {p ? shortDate(p.startDate) : ""} ·{" "}
                        {p?.hoursFrom}–{p?.hoursTo}
                      </p>
                    </div>
                    <p className="text-lg font-extrabold">
                      {money(a.dailyRate)}
                      <span className="block text-[11px] font-normal text-slate-600">{t("common.perDay")}</span>
                    </p>
                  </div>
                  <Link href="/worker/jobs" data-tap className="btn btn-primary mt-3 w-full">
                    {t("wk.viewJob")}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <Section
        title={t("wk.todayJobs")}
        action={
          <Link href="/worker/jobs" className="-my-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
            {t("common.viewAll")}
          </Link>
        }
      >
        {active.length === 0 ? (
          <EmptyState title={t("wk.noRequests")} body={t("wk.noRequestsBody")} />
        ) : (
          <ul className="space-y-3">
            {active.map((b) => (
              <li key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{t(`cat.${b.category}`)}</p>
                    <p className="text-xs text-slate-600">{b.addressLine}</p>
                    <p className="text-xs text-slate-600">
                      {b.date === today ? t("common.today") : shortDate(b.date)} · {b.time}
                    </p>
                  </div>
                  <p className="font-extrabold">{money(b.price)}</p>
                </div>
                <div className="mt-2">
                  <StatusPill status={b.status} t={t} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status === "confirmed" && (
                    <form action={setBookingStatus}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="status" value="en-route" />
                      <button className="btn btn-ghost">{t("wk.onMyWay")}</button>
                    </form>
                  )}
                  {["confirmed", "en-route"].includes(b.status) && (
                    <form action={setBookingStatus}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="status" value="in-progress" />
                      <button className="btn btn-primary">{t("wk.startJob")}</button>
                    </form>
                  )}
                  {b.status === "in-progress" && (
                    <form action={setBookingStatus}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="status" value="completed" />
                      <button className="btn btn-primary">{t("wk.completeJob")}</button>
                    </form>
                  )}
                  <Link href={`/worker/jobs/${b.id}`} data-tap className="btn btn-ghost">
                    {t("wk.viewJob")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/worker/availability" className="card p-4">
          <p className="font-bold">🗓️ {t("wk.avail.title")}</p>
          <p className="mt-1 text-sm text-slate-600">
            {daysLabel(worker.availableDays, t)}, {worker.availableFrom}–{worker.availableTo}
          </p>
        </Link>
        <Link href="/worker/reviews" className="card p-4">
          <p className="font-bold">⭐ {t("wk.reviews.title")}</p>
          <p className="mt-1 text-sm text-slate-600">
            <Stars rating={worker.rating} count={reviews.length} t={t} />
          </p>
        </Link>
      </div>

      <Link href="/worker/why" className="card block bg-teal-50 p-4">
        <p className="font-bold">{t("wk.why.title")}</p>
        <p className="mt-1 text-sm text-slate-700">
          {t("wk.why.4.t")} · {t("wk.why.1.t")} · {t("wk.why.2.t")}
        </p>
      </Link>
    </div>
  );
}
