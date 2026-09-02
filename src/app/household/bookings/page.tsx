import Link from "next/link";
import { currentHousehold } from "@/lib/session";
import { getWorker, householdBookings } from "@/lib/repo";
import { getI18n } from "@/i18n/server";
import { EmptyState, Section, StatusPill } from "@/components/ui";
import { WorkerAvatar } from "@/components/WorkerAvatar";

export default async function BookingsPage() {
  const household = await currentHousehold();
  if (!household) return null;
  const { t, money, shortDate } = await getI18n();

  const all = householdBookings(household.id);
  const live = all.filter((b) => !["completed", "cancelled", "declined"].includes(b.status));
  const past = all.filter((b) => ["completed", "cancelled", "declined"].includes(b.status));

  const row = (b: (typeof all)[number]) => {
    const w = getWorker(b.workerId ?? "");
    return (
      <li key={b.id}>
        <Link href={`/household/bookings/${b.id}`} className="card flex items-center gap-3 p-4">
          {w ? <WorkerAvatar id={w.id} name={w.name} trade={b.category} photo={w.photo} size={40} /> : <span className="text-2xl">🔎</span>}
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold">{w?.name ?? t("hh.findingWorker")}</span>
              <span className="text-sm font-bold">{money(b.price)}</span>
            </span>
            <span className="block text-xs text-slate-600">
              {t(`cat.${b.category}`)} · {shortDate(b.date)} · {t(`hh.type.${b.type}`)}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={b.status} t={t} />
              {b.status === "completed" && !b.reviewId && (
                <span className="pill bg-amber-50 text-amber-800 ring-1 ring-amber-200">{t("hh.leaveRating")}</span>
              )}
            </span>
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">{t("hh.bookings.title")}</h1>

      <Section title={`${t("hh.bookings.upcoming")} (${live.length})`}>
        {live.length ? (
          <ul className="space-y-3">{live.map(row)}</ul>
        ) : (
          <EmptyState
            title={t("hh.empty.title")}
            body={t("hh.empty.body")}
            cta={
              <Link href="/household/post" data-tap className="btn btn-primary">
                {t("hh.empty.cta")}
              </Link>
            }
          />
        )}
      </Section>

      <Section title={`${t("hh.bookings.past")} (${past.length})`}>
        {past.length ? (
          <ul className="space-y-3">{past.slice(0, 40).map(row)}</ul>
        ) : (
          <p className="card p-4 text-sm text-slate-600">{t("hh.empty.title")}</p>
        )}
      </Section>
    </div>
  );
}
