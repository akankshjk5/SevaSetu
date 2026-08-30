import { currentWorker } from "@/lib/session";
import { saveAvailability } from "@/lib/actions";
import { getI18n } from "@/i18n/server";
import { BackLink, DAY_INDEXES, daysLabel } from "@/components/ui";

export default async function AvailabilityPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const worker = (await currentWorker())!;
  const { t } = await getI18n();

  return (
    <div className="space-y-5">
      <BackLink href="/worker" label={t("wk.nav.home")} />
      <div>
        <h1 className="text-2xl font-extrabold">{t("wk.avail.title")}</h1>
        <p className="text-sm text-slate-600">{t("wk.avail.sub")}</p>
      </div>

      {sp.saved === "1" && (
        <p className="card border-teal-200 bg-teal-50 p-3 text-sm font-semibold text-teal-900">{t("wk.avail.saved")}</p>
      )}

      <form action={saveAvailability} className="card space-y-4 p-4">
        <fieldset>
          <legend className="text-sm font-semibold">{t("wk.avail.days")}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DAY_INDEXES.map((i) => (
              <label
                key={i}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-slate-300 has-checked:bg-brand has-checked:text-white has-checked:ring-brand"
              >
                <input
                  type="checkbox"
                  name="days"
                  value={i}
                  defaultChecked={worker.availableDays.includes(i)}
                  className="sr-only"
                />
                {t(`day.${i}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("wk.avail.from")}
            <input type="time" name="from" defaultValue={worker.availableFrom} className="field mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("wk.avail.to")}
            <input type="time" name="to" defaultValue={worker.availableTo} className="field mt-1" />
          </label>
        </div>

        <p className="rounded-xl bg-slate-50 p-3 text-sm">
          <strong>{daysLabel(worker.availableDays, t)}</strong>, {worker.availableFrom} – {worker.availableTo}
        </p>

        <button className="btn btn-primary w-full">{t("common.save")}</button>
      </form>
    </div>
  );
}
