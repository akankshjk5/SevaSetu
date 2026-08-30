import Link from "next/link";
import { currentWorker } from "@/lib/session";
import { CATEGORIES } from "@/lib/categories";
import { ZONES, CITY } from "@/lib/seed";
import { saveWorkerProfile } from "@/lib/actions";
import { getI18n } from "@/i18n/server";

import { WorkerAvatar } from "@/components/WorkerAvatar";

export default async function WorkerProfilePage() {
  const worker = (await currentWorker())!;
  const { t, money } = await getI18n();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">{t("wk.profile.title")}</h1>
        <p className="text-sm text-slate-600">{t("wk.profile.sub")}</p>
      </div>

      <form action={saveWorkerProfile} className="space-y-5">
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <WorkerAvatar id={worker.id} name={worker.name} trade={worker.categories[0]} photo={worker.photo} size={64} ring />
            <div>
              <p className="text-sm font-semibold">{t("wk.profile.photo")}</p>
              <p className="text-xs text-slate-600">{t("wk.profile.photoHint")}</p>
              <label className="btn btn-ghost mt-2 inline-flex cursor-pointer text-sm">
                📷 {t("wk.profile.photo")}
                <input type="file" accept="image/*" className="sr-only" />
              </label>
            </div>
          </div>
        </div>

        <div className="card space-y-4 p-4">
          <label className="block text-sm font-semibold">
            {t("wk.profile.name")}
            <input name="name" defaultValue={worker.name} className="field mt-1" required />
          </label>

          <label className="block text-sm font-semibold">
            {t("wk.profile.area")}
            <select name="locality" defaultValue={worker.locality} className="field mt-1">
              {ZONES.map((z) => (
                <option key={z.name}>{z.name}</option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-semibold">{t("wk.profile.skills")}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 has-checked:border-teal-500 has-checked:bg-teal-50"
                >
                  <input
                    type="checkbox"
                    name="categories"
                    value={c.id}
                    defaultChecked={worker.categories.includes(c.id)}
                    className="h-5 w-5"
                  />
                  <span className="text-sm font-semibold">
                    <span aria-hidden className="mr-1">
                      {c.icon}
                    </span>
                    {t(`cat.${c.id}`)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {t("wk.profile.experience")}
              <input
                type="number"
                name="experienceYears"
                min={0}
                max={50}
                defaultValue={worker.experienceYears}
                className="field mt-1"
              />
            </label>
            <label className="block text-sm font-semibold">
              {t("wk.profile.wage")}
              <input type="number" name="wage" min={0} defaultValue={worker.wage} className="field mt-1" />
              <span className="mt-1 block text-xs font-normal text-slate-600">{t("wk.profile.wageHint")}</span>
            </label>
          </div>

          <label className="block text-sm font-semibold">
            {t("wk.profile.languages")}
            <input
              name="languages"
              defaultValue={worker.languages.join(", ")}
              placeholder="Hindi, Marwari"
              className="field mt-1"
            />
          </label>

          <label className="block text-sm font-semibold">
            {t("wk.profile.about")}
            <textarea name="bio" rows={3} defaultValue={worker.bio} className="field mt-1" />
          </label>
        </div>

        <button className="btn btn-primary w-full">{t("wk.profile.saveNext")}</button>
      </form>

      <div className="card p-4">
        <p className="text-sm font-semibold">
          {t("wk.profile.wage")} · {worker.locality}, {CITY}
        </p>
        <p className="text-2xl font-extrabold">{worker.wage ? money(worker.wage) : "—"}</p>
        <Link href="/worker/availability" className="mt-2 inline-block text-sm font-semibold text-brand">
          {t("wk.avail.title")} →
        </Link>
      </div>
    </div>
  );
}
