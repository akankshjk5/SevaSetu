import Link from "next/link";
import { currentHousehold } from "@/lib/session";
import { getWorker, householdBookings } from "@/lib/repo";
import { requestReplacement, togglePause } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { LOCALE_META } from "@/i18n/config";
import { DAY_INDEXES, EmptyState, Stars, VerifiedBadge, daysLabel } from "@/components/ui";
import { WorkerAvatar } from "@/components/WorkerAvatar";

function monthGrid(intl: string) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return {
    lead: first.getDay(),
    days,
    today: now.getDate(),
    label: new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" }).format(now),
  };
}

export default async function TeamPage() {
  const household = await currentHousehold();
  if (!household) return null;
  const { t, money, locale } = await getI18n();

  const team = householdBookings(household.id).filter(
    (b) => b.schedule && !["cancelled", "declined"].includes(b.status),
  );
  const grid = monthGrid(LOCALE_META[locale].intl);
  const activeDays = new Set(team.filter((b) => !b.schedule!.paused).flatMap((b) => b.schedule!.days));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("hh.team.title")}</h1>
        <p className="text-sm text-slate-600">{t("hh.team.sub")}</p>
      </div>

      {team.length === 0 ? (
        <EmptyState
          title={t("hh.team.noTeam")}
          body={t("hh.team.noTeamBody")}
          cta={
            <Link href="/household/post" data-tap className="btn btn-primary">
              {t("hh.empty.cta")}
            </Link>
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {team.map((b) => {
              const w = getWorker(b.workerId ?? "");
              if (!w) return null;
              return (
                <li key={b.id} className="card p-4">
                  <div className="flex gap-3">
                    <WorkerAvatar id={w.id} name={w.name} trade={b.category} photo={w.photo} size={52} ring />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">{w.name}</p>
                          <p className="text-xs text-slate-600">{t(`cat.${b.category}`)}</p>
                        </div>
                        <p className="font-bold">{money(b.price)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Stars rating={w.rating} count={w.jobsCompleted} t={t} />
                        {w.verified && <VerifiedBadge t={t} compact />}
                        {b.schedule!.paused && <span className="pill bg-slate-100 text-slate-700">{t("hh.paused")}</span>}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm">
                    <span className="font-semibold">{daysLabel(b.schedule!.days, t)}</span> · {b.schedule!.time}
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <form action={togglePause}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <button className="btn btn-ghost w-full">
                        {b.schedule!.paused ? t("hh.booking.resume") : t("hh.booking.pause")}
                      </button>
                    </form>
                    <form action={requestReplacement}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <button className="btn btn-ghost w-full">{t("hh.booking.replacement")}</button>
                    </form>
                    <Link href={`/household/bookings/${b.id}`} data-tap className="btn btn-ghost w-full">
                      {t("hh.booking.track")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>

          <section className="card p-4">
            <h2 className="font-bold">{grid.label}</h2>
            <p className="text-xs text-slate-600">{t("hh.team.calendar")}</p>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
              {DAY_INDEXES.map((d) => (
                <span key={d}>{t(`day.${d}`)}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: grid.lead }).map((_, i) => (
                <span key={`lead-${i}`} />
              ))}
              {Array.from({ length: grid.days }).map((_, i) => {
                const day = i + 1;
                const dow = (grid.lead + i) % 7;
                const has = activeDays.has(dow);
                return (
                  <span
                    key={day}
                    className={`flex h-9 items-center justify-center rounded-lg text-sm ${
                      has ? "bg-teal-50 font-semibold text-teal-900 ring-1 ring-teal-200" : "text-slate-500"
                    } ${day === grid.today ? "ring-2 ring-brand" : ""}`}
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
