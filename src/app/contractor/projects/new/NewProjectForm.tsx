"use client";

import { useState } from "react";
import { createProject } from "@/lib/actions-phases";
import { SITE_CATEGORIES } from "@/lib/categories";
import { useI18n } from "@/i18n/client";
import type { CategoryId } from "@/lib/types";

export function NewProjectForm({ zones, defaultDistrict }: { zones: { name: string }[]; defaultDistrict: string }) {
  const { t } = useI18n();
  const [trades, setTrades] = useState<CategoryId[]>([]);

  const toggle = (id: CategoryId) =>
    setTrades((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <form action={createProject} className="space-y-4">
      <div className="card space-y-4 p-4">
        <label className="block text-sm font-semibold">
          {t("ct.project.name")}
          <input name="name" className="field mt-1" required />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("ct.project.site")}
            <select name="district" defaultValue={defaultDistrict} className="field mt-1">
              {zones.map((z) => (
                <option key={z.name}>{z.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {t("hh.post.address")}
            <input name="siteAddress" className="field mt-1" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("ct.project.start")}
            <input type="date" name="startDate" defaultValue={new Date().toISOString().slice(0, 10)} className="field mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("ct.project.duration")}
            <input type="number" name="durationDays" min={1} defaultValue={30} className="field mt-1" />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            {t("ct.project.hours")} — {t("wk.avail.from")}
            <input type="time" name="hoursFrom" defaultValue="08:00" className="field mt-1" />
          </label>
          <label className="block text-sm font-semibold">
            {t("ct.project.hours")} — {t("wk.avail.to")}
            <input type="time" name="hoursTo" defaultValue="18:00" className="field mt-1" />
          </label>
        </div>
      </div>

      <fieldset className="card space-y-3 p-4">
        <legend className="text-sm font-semibold">{t("ct.project.trades")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SITE_CATEGORIES.map((c) => {
            const on = trades.includes(c.id);
            return (
              <div key={c.id} className={`rounded-xl border p-3 ${on ? "border-teal-500 bg-teal-50" : "border-slate-200"}`}>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="trades"
                    value={c.id}
                    checked={on}
                    onChange={() => toggle(c.id)}
                    className="h-5 w-5"
                  />
                  <span aria-hidden>{c.icon}</span>
                  {t(`cat.${c.id}`)}
                </label>
                {on && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="block text-xs font-semibold">
                      {t("ct.project.count")}
                      <input type="number" name={`count_${c.id}`} min={1} defaultValue={2} className="field mt-1" />
                    </label>
                    <label className="block text-xs font-semibold">
                      {t("ct.project.rate")}
                      <input
                        type="number"
                        name={`rate_${c.id}`}
                        min={1}
                        defaultValue={c.typicalPrice}
                        className="field mt-1"
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <button className="btn btn-primary w-full" disabled={trades.length === 0}>
        {t("ct.project.create")}
      </button>
    </form>
  );
}
