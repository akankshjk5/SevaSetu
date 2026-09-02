import { notFound } from "next/navigation";
import { currentHousehold } from "@/lib/session";
import { db } from "@/lib/store";
import { getWorker } from "@/lib/repo";
import { advanceRapidOrder } from "@/lib/actions-rapid";
import { getI18n } from "@/i18n/server";
import { BackLink } from "@/components/ui";
import { WorkerAvatar } from "@/components/WorkerAvatar";
import type { RapidOrderStatus } from "@/lib/types";

const TRACK: RapidOrderStatus[] = ["placed", "assigned", "picked-up", "delivered"];

export default async function RapidOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const household = (await currentHousehold())!;
  const order = db().rapidOrders.find((o) => o.id === id);
  if (!order || order.householdId !== household.id) notFound();

  const { t, money } = await getI18n();
  const worker = getWorker(order.workerId ?? "");
  const step = TRACK.indexOf(order.status);

  const what =
    order.kind === "dukaan"
      ? `${t("rapid.dukaan")} — ${order.shopName}`
      : order.kind === "minutes"
        ? `${t("rapid.minutes")} — ${t(`cat.${order.trade}`)}`
        : t("rapid.runner");

  return (
    <div className="space-y-5">
      <BackLink href="/household" label={t("hh.nav.home")} />

      <div className="card overflow-hidden">
        <div className="bg-marigold-soft/60 p-4">
          <p className="text-xs font-bold tracking-wide text-amber-900 uppercase">{t("rapid.title")}</p>
          <h1 className="mt-1 text-lg font-extrabold">{what}</h1>
          <p className="text-sm text-slate-700">{order.addressLine}</p>
        </div>

        <dl className="grid grid-cols-2 gap-px bg-slate-100">
          <div className="bg-white p-4">
            <dt className="text-xs font-semibold text-slate-500">{t("rapid.fee")}</dt>
            <dd className="text-xl font-extrabold text-brand">{money(order.fee)}</dd>
          </div>
          <div className="bg-white p-4">
            <dt className="text-xs font-semibold text-slate-500">{t("rapid.eta")}</dt>
            <dd className="text-xl font-extrabold">{t("rapid.withinMins", { n: order.etaMins })}</dd>
          </div>
        </dl>

        {order.notes && (
          <p className="border-t border-slate-100 p-4 text-sm">
            <span className="font-semibold">{t("common.notes")}: </span>
            {order.notes}
          </p>
        )}
      </div>

      {/* Who is coming — the same question the worker's job card answers. */}
      <div className="card p-4">
        {worker ? (
          <div className="flex items-center gap-3">
            <WorkerAvatar id={worker.id} name={worker.name} trade={order.trade} photo={worker.photo} size={48} ring />
            <div>
              <p className="font-bold">{t("rapid.assigned", { name: worker.name })}</p>
              <p className="text-xs text-slate-600">
                {worker.locality}
                {order.notifiedAt ? ` · 💬 ${t("wa.sentTo", { name: worker.name })}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm font-semibold">{t("rapid.findingRunner")}</p>
        )}
      </div>

      <div className="card p-4">
        <ol className="space-y-3">
          {TRACK.map((s, i) => {
            const done = step >= i;
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
                <span className={`text-sm ${done ? "font-semibold" : "text-slate-500"}`}>{t(`rapid.status.${s}`)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Demo controls: in the real app the runner moves these from their phone. */}
      <div className="card border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">{t("hh.booking.demoControls")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TRACK.map((s) => (
            <form key={s} action={advanceRapidOrder}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value={s} />
              <button className="pill bg-white text-slate-700 ring-1 ring-slate-300">
                {t("hh.booking.markAs", { status: t(`rapid.status.${s}`) })}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
