"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HOUSEHOLD_CATEGORIES, CATEGORY_MAP, priceUnitKey } from "@/lib/categories";
import type { BookingType, CategoryId } from "@/lib/types";
import { useI18n } from "@/i18n/client";
import { DAY_INDEXES } from "@/components/ui";

const TYPES: BookingType[] = ["one-time", "daily", "weekly", "recurring"];

export function PostNeedForm({
  initialCategory,
  zones,
  defaultLocality,
  defaultAddress,
}: {
  initialCategory?: CategoryId;
  zones: { name: string; lat: number; lng: number }[];
  defaultLocality: string;
  defaultAddress: string;
}) {
  const router = useRouter();
  const { t, money } = useI18n();

  const [step, setStep] = useState(initialCategory ? 2 : 1);
  const [category, setCategory] = useState<CategoryId | undefined>(initialCategory);
  const [type, setType] = useState<BookingType>("recurring");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("08:00");
  const [duration, setDuration] = useState(90);
  const [locality, setLocality] = useState(defaultLocality);
  const [address, setAddress] = useState(defaultAddress);
  const [budget, setBudget] = useState<number | "">("");

  const cat = category ? CATEGORY_MAP[category] : undefined;
  const oneOffTrade = cat?.kind === "oneoff";
  const suggestedBudget = useMemo(() => cat?.typicalPrice ?? 0, [cat]);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  function submit() {
    if (!category) return;
    const params = new URLSearchParams({
      category,
      type: oneOffTrade ? "one-time" : type,
      days: (oneOffTrade ? [new Date(date).getDay()] : days).join(","),
      date,
      time,
      duration: String(duration),
      locality,
      address,
      budget: String(budget === "" ? suggestedBudget : budget),
    });
    router.push(`/household/matches?${params.toString()}`);
  }

  return (
    <div className="space-y-5">
      <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {["hh.post.step1", "hh.post.step2", "hh.post.step3"].map((key, i) => (
          <li key={key} className={`flex items-center gap-2 ${step === i + 1 ? "text-brand" : ""}`}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                step > i ? "bg-brand text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {i + 1}
            </span>
            {t(key)}
            {i < 2 && <span className="text-slate-300">—</span>}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">{t("hh.post.whatHelp")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {HOUSEHOLD_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategory(c.id);
                  setType(c.kind === "oneoff" ? "one-time" : "recurring");
                  setDuration(c.kind === "oneoff" ? 60 : 90);
                  setStep(2);
                }}
                className={`card flex flex-col items-start gap-1 p-4 text-left ${
                  category === c.id ? "ring-2 ring-teal-500" : ""
                }`}
              >
                <span aria-hidden className="text-2xl">
                  {c.icon}
                </span>
                <span className="font-semibold">{t(`cat.${c.id}`)}</span>
                <span className="text-xs text-slate-600">{t(`cat.${c.id}.blurb`)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && cat && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">{t("hh.post.whenNeed", { service: t(`cat.${cat.id}`) })}</h2>

          {!oneOffTrade && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPES.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={type === id}
                  onClick={() => {
                    setType(id);
                    if (id === "daily") setDays([0, 1, 2, 3, 4, 5, 6]);
                    if (id === "weekly") setDays([6]);
                  }}
                  className={`card p-3 text-left ${type === id ? "ring-2 ring-teal-500" : ""}`}
                >
                  <span className="block text-sm font-semibold">{t(`hh.type.${id}`)}</span>
                  <span className="block text-xs text-slate-600">{t(`hh.type.${id}.hint`)}</span>
                </button>
              ))}
            </div>
          )}

          {!oneOffTrade && type !== "one-time" && (
            <div>
              <p className="text-sm font-semibold">{t("hh.post.whichDays")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DAY_INDEXES.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    aria-pressed={days.includes(i)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      days.includes(i) ? "bg-brand text-white" : "bg-white text-slate-700 ring-1 ring-slate-300"
                    }`}
                  >
                    {t(`day.${i}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {oneOffTrade || type === "one-time" ? t("hh.post.dateOfVisit") : t("hh.post.startFrom")}
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field mt-1" />
            </label>
            <label className="block text-sm font-semibold">
              {t("hh.post.preferredTime")}
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="field mt-1" />
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold">{t("hh.post.howLong")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[30, 60, 90, 120, 180].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDuration(m)}
                  aria-pressed={duration === m}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    duration === m ? "bg-brand text-white" : "bg-white text-slate-700 ring-1 ring-slate-300"
                  }`}
                >
                  {m < 60 ? `${m} min` : `${m / 60} hr`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn btn-ghost">
              {t("common.back")}
            </button>
            <button type="button" onClick={() => setStep(3)} className="btn btn-primary flex-1">
              {t("common.next")}
            </button>
          </div>
        </section>
      )}

      {step === 3 && cat && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">{t("hh.post.whereCome")}</h2>

          <label className="block text-sm font-semibold">
            {t("hh.post.area")}
            <select value={locality} onChange={(e) => setLocality(e.target.value)} className="field mt-1">
              {zones.map((z) => (
                <option key={z.name}>{z.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            {t("hh.post.address")}
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="field mt-1" />
          </label>

          <div className="card overflow-hidden">
            <div className="relative h-40 bg-teal-50/40 bg-[length:24px_24px] bg-[linear-gradient(0deg,#eef2f6_1px,transparent_1px),linear-gradient(90deg,#eef2f6_1px,transparent_1px)]">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-3xl" aria-hidden>
                📍
              </span>
              <span className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-slate-600">
                {t("hh.post.pinDropped", { locality })}
              </span>
            </div>
          </div>

          <label className="block text-sm font-semibold">
            {t("hh.post.budget", { unit: t(priceUnitKey(cat.priceUnit)) })}
            <input
              type="number"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder={t("hh.post.budgetHint", { price: money(suggestedBudget) })}
              className="field mt-1"
            />
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="btn btn-ghost">
              {t("common.back")}
            </button>
            <button type="button" onClick={submit} className="btn btn-primary flex-1">
              {t("hh.post.showWorkers")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
