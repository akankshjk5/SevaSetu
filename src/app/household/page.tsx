import Link from "next/link";
import { currentHousehold } from "@/lib/session";
import { householdBookings, getWorker } from "@/lib/repo";
import { HOUSEHOLD_CATEGORIES } from "@/lib/categories";
import { getI18n } from "@/i18n/server";
import { ProtectionPanel } from "@/components/protection";
import { EmptyState, Section, StatusPill } from "@/components/ui";
import { WorkerAvatar } from "@/components/WorkerAvatar";

export default async function HouseholdHome() {
  const household = await currentHousehold();
  if (!household) return null;
  const { t, money, shortDate } = await getI18n();

  const bookings = householdBookings(household.id);
  const live = bookings.filter((b) => !["completed", "cancelled", "declined"].includes(b.status));
  const team = bookings.filter((b) => b.schedule && b.status !== "cancelled").slice(0, 4);
  const needsReview = bookings.filter((b) => b.status === "completed" && !b.reviewId).slice(0, 1);

  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between p-4.5 border-amber-900/10 bg-gradient-to-r from-teal-900 to-slate-900 text-white shadow-sm">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-2.5 py-0.5 text-[11px] font-bold text-teal-300 ring-1 ring-teal-400/30">
            📍 {household.locality || "Jaipur"}
          </span>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-white">
            {t("hh.hello", { name: household.name.split(" ")[0] })}
          </h1>
          <p className="text-xs text-slate-300 truncate max-w-sm">{household.addressLine}</p>
        </div>
        <Link
          href="/household/post"
          data-tap
          className="rounded-xl bg-teal-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-sm transition hover:bg-teal-400 active:scale-95 shrink-0"
        >
          + Book a helper
        </Link>
      </div>

      <Section title={t("hh.needToday")}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {HOUSEHOLD_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              data-tap
              href={`/household/post?category=${c.id}`}
              className="card group flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
            >
              <span aria-hidden className="icon-tile group-hover:scale-110 transition">
                {c.icon}
              </span>
              <div className="min-w-0 flex-1">
                <span className="block text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-teal-800 transition">
                  {t(`cat.${c.id}`)}
                </span>
                <span className="block text-[11px] text-slate-500 truncate">
                  {t(`cat.${c.id}.blurb`)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {needsReview.length > 0 && (
        <div className="card border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold">
            {t("hh.reviewPrompt", { name: getWorker(needsReview[0].workerId ?? "")?.name ?? "" })}
          </p>
          <p className="mt-1 text-xs text-slate-700">{t("hh.reviewPromptSub", { locality: household.locality })}</p>
          <Link href={`/household/bookings/${needsReview[0].id}#review`} data-tap className="btn btn-dark mt-3">
            {t("hh.leaveRating")}
          </Link>
        </div>
      )}

      <Section
        title={t("hh.happeningNow")}
        action={
          <Link href="/household/bookings" className="-my-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
            {t("hh.allBookings")}
          </Link>
        }
      >
        {live.length === 0 ? (
          <EmptyState
            title={t("hh.empty.title")}
            body={t("hh.empty.body")}
            cta={
              <Link href="/household/post" data-tap className="btn btn-primary">
                {t("hh.empty.cta")}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {live.map((b) => {
              const w = getWorker(b.workerId ?? "");
              return (
                <li key={b.id}>
                  <Link href={`/household/bookings/${b.id}`} className="card flex items-center gap-3 p-4">
                    {w ? <WorkerAvatar id={w.id} name={w.name} trade={b.category} photo={w.photo} /> : <span className="text-2xl">🔎</span>}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{w?.name ?? t("hh.findingWorker")}</span>
                        <span className="text-sm font-bold">{money(b.price)}</span>
                      </span>
                      <span className="block text-xs text-slate-600">
                        {t(`cat.${b.category}`)} · {shortDate(b.date)} · {b.time}
                      </span>
                      <span className="mt-2 block">
                        <StatusPill status={b.status} t={t} />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {team.length > 0 && (
        <Section
          title={t("hh.myTeam")}
          action={
            <Link href="/household/team" className="-my-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand">
              {t("common.manage")}
            </Link>
          }
        >
          <ul className="grid grid-cols-2 gap-3">
            {team.map((b) => {
              const w = getWorker(b.workerId ?? "");
              if (!w) return null;
              return (
                <li key={b.id} className="card flex items-center gap-2 p-3">
                  <WorkerAvatar id={w.id} name={w.name} trade={b.category} photo={w.photo} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{w.name}</span>
                    <span className="block text-xs text-slate-600">{t(`cat.${b.category}`)}</span>
                    {b.schedule?.paused && <span className="pill mt-1 bg-slate-100 text-slate-700">{t("hh.paused")}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <ProtectionPanel covered t={t} />
    </div>
  );
}
