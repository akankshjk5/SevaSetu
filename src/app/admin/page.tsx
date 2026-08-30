import Link from "next/link";
import { db } from "@/lib/store";
import { ZONES, CITY } from "@/lib/seed";
import {
  activeBookings,
  activeWorkerCount,
  avgVerificationTurnaroundDays,
  getHousehold,
  getWorker,
  verificationQueue,
} from "@/lib/repo";
import { getI18n } from "@/i18n/server";
import { StatusPill } from "@/components/ui";

export default async function AdminHome() {
  const { t, money, shortDate } = await getI18n();
  const data = db();
  const live = activeBookings();
  const openDisputes = data.disputes.filter((d) => d.status === "open");
  const flagged = data.reviews.filter((r) => r.status === "flagged");

  const byZone = ZONES.map((z) => ({ zone: z.name, count: live.filter((b) => b.district === z.name).length }));
  const maxZone = Math.max(1, ...byZone.map((z) => z.count));

  const tiles = [
    { k: t("ad.activeNow"), v: live.length, href: "#live" },
    { k: t("ad.queue"), v: verificationQueue().length, href: "/admin/verification" },
    { k: t("ad.openDisputes"), v: openDisputes.length, href: "/admin/disputes" },
    { k: t("ad.flaggedReviews"), v: flagged.length, href: "/admin/reviews" },
    { k: t("gov.kpi.verified"), v: activeWorkerCount(), href: "/admin/verification" },
    { k: t("ad.turnaround"), v: t("ad.days", { n: avgVerificationTurnaroundDays() }), href: "/admin/verification" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">
          {t("ad.title")} — {CITY}
        </h1>
        <p className="text-sm text-slate-600">{t("ad.live.sub")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <Link key={tile.k} href={tile.href} className="card p-4">
            <p className="text-2xl font-extrabold">{tile.v}</p>
            <p className="text-xs text-slate-600">{tile.k}</p>
          </Link>
        ))}
      </div>

      <section className="card p-4">
        <h2 className="font-bold">{t("ad.live.title")}</h2>
        <ul className="mt-3 space-y-2">
          {byZone.map((z) => (
            <li key={z.zone} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-sm font-medium">{z.zone}</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span
                  className="block h-full rounded-full bg-slate-800"
                  style={{ width: `${(z.count / maxZone) * 100}%` }}
                />
              </span>
              <span className="w-8 text-right text-sm font-bold">{z.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="live" className="space-y-3">
        <h2 className="text-base font-bold">
          {t("ad.activeNow")} ({live.length})
        </h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="p-3">{t("hh.post.step1")}</th>
                <th className="p-3">{t("common.worker")}</th>
                <th className="p-3">{t("common.household")}</th>
                <th className="p-3">{t("gov.district")}</th>
                <th className="p-3">{t("common.date")}</th>
                <th className="p-3">{t("common.price")}</th>
                <th className="p-3">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {live.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{t(`cat.${b.category}`)}</td>
                  <td className="p-3">{getWorker(b.workerId ?? "")?.name ?? "—"}</td>
                  <td className="p-3">{getHousehold(b.householdId)?.name ?? "—"}</td>
                  <td className="p-3">{b.district}</td>
                  <td className="p-3">
                    {shortDate(b.date)} · {b.time}
                  </td>
                  <td className="p-3 font-semibold">{money(b.price)}</td>
                  <td className="p-3">
                    <StatusPill status={b.status} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
